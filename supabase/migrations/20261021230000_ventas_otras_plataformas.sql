-- Ventas por correo de eBay, Milanuncios y Facebook Marketplace (leídas con IA).
-- · Nuevo tipo de correo «otra_venta» y nuevas plataformas.
-- · Confirmar / marcar duplicado aceptan esas ventas y buscan su plataforma
--   en Listas y ajustes por el nombre («Facebook Marketplace» para facebook).

alter table public.email_messages drop constraint if exists email_messages_platform_check;
alter table public.email_messages add constraint email_messages_platform_check
  check (platform in ('vinted', 'wallapop', 'ebay', 'milanuncios', 'facebook'));
alter table public.email_messages drop constraint if exists email_messages_kind_check;
alter table public.email_messages add constraint email_messages_kind_check
  check (kind in ('vinted_venta', 'vinted_etiqueta', 'wallapop_venta', 'wallapop_aviso', 'otra_venta', 'otro'));
alter table public.email_accounts drop constraint if exists email_accounts_platform_check;
alter table public.email_accounts add constraint email_accounts_platform_check
  check (platform in ('vinted', 'wallapop', 'ebay', 'milanuncios', 'facebook'));

-- ¿El nombre de la plataforma (Listas y ajustes) corresponde a la del correo?
create or replace function private.platform_is(p_name text, p_platform text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(lower(regexp_replace(p_name, '[^a-zA-Z]', '', 'g')) like
    case p_platform
      when 'facebook' then 'facebook%'
      else p_platform || '%'
    end, false);
$$;

create or replace function private.platform_label(p_platform text)
returns text
language sql
immutable
as $$
  select case p_platform
    when 'vinted' then 'Vinted' when 'wallapop' then 'Wallapop' when 'ebay' then 'eBay'
    when 'milanuncios' then 'Milanuncios' when 'facebook' then 'Facebook Marketplace' else p_platform end;
$$;

create or replace function public.email_register_sale(
  p_email_id uuid,
  p_variant_id uuid,
  p_alias text default null,
  p_alias_norm text default null,
  p_price numeric default null,
  p_carrier_id uuid default null,
  p_responsible_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_user boolean := auth.uid() is not null;   -- antes de que email_actor fije el usuario
  v_actor uuid := private.email_actor(p_email_id);
  e public.email_messages%rowtype;
  v_platform uuid;
  v_price numeric;
  v_lot uuid;
  v_resp uuid;
  v_mobile uuid;
  v_date date;
  v_sale uuid;
  v_handle text;
  v_carrier uuid;
  v_platform_name text;
begin
  select * into e from public.email_messages where id = p_email_id for update;
  if not found then
    raise exception 'El correo no existe.';
  end if;
  if e.sale_id is not null then
    return e.sale_id;                     -- ya confirmada (o marcada como duplicado): no se duplica
  end if;
  if e.kind not in ('vinted_venta', 'wallapop_venta', 'otra_venta') then
    raise exception 'Este correo no es una venta.';
  end if;
  if exists (select 1 from public.sales where source_email_id = e.id) then
    select id into v_sale from public.sales where source_email_id = e.id;
    update public.email_messages set sale_id = v_sale, status = 'procesado', processed_at = coalesce(processed_at, now()), updated_at = now() where id = e.id;
    return v_sale;
  end if;

  if (p_price is not null or p_carrier_id is not null or p_responsible_id is not null) and not v_is_user then
    raise exception 'Solo el administrador puede cambiar los datos detectados.';
  end if;
  v_price := coalesce(p_price, nullif(e.parsed ->> 'price', '')::numeric);
  if v_price is null or v_price <= 0 then
    raise exception 'El correo no tiene un precio válido.';
  end if;
  if not exists (select 1 from public.product_variants where id = p_variant_id and deleted_at is null) then
    raise exception 'El producto elegido no existe.';
  end if;

  select id, name into v_platform, v_platform_name from public.platforms
   where private.platform_is(name, e.platform) and active
   order by length(name)
   limit 1;
  if v_platform is null and e.platform in ('ebay', 'milanuncios', 'facebook') then
    -- Primera venta de esa plataforma: se añade a Listas y ajustes (con envío)
    insert into public.platforms (name, requires_shipping)
    values (private.platform_label(e.platform), true)
    returning id, name into v_platform, v_platform_name;
  end if;
  if v_platform is null then
    raise exception 'No existe la plataforma % en Listas y ajustes.', private.platform_label(e.platform);
  end if;

  v_handle := e.parsed ->> 'account_norm';
  select responsible_id, mobile_device_id into v_resp, v_mobile
    from public.email_accounts where platform = e.platform and handle_norm = v_handle;
  if p_responsible_id is not null then
    if not exists (select 1 from public.responsibles where id = p_responsible_id and deleted_at is null) then
      raise exception 'El responsable seleccionado no existe.';
    end if;
    v_resp := p_responsible_id;
  end if;
  if v_resp is null then
    select default_responsible_id into v_resp from public.email_integration where id;
  end if;
  if v_resp is null then
    raise exception 'Falta el responsable: elige uno al confirmar, asígnalo a la cuenta «%» o elige un responsable por defecto en Ventas por correo.', coalesce(e.parsed ->> 'account', '?');
  end if;

  -- Transportista: el elegido, o el detectado en el correo
  v_carrier := p_carrier_id;
  if v_carrier is not null and not exists (select 1 from public.carriers where id = v_carrier) then
    raise exception 'El transportista no existe.';
  end if;
  if v_carrier is null and nullif(e.parsed ->> 'carrier_name', '') is not null then
    select id into v_carrier from public.carriers
     where active and lower(name) = lower(e.parsed ->> 'carrier_name')
     limit 1;
  end if;

  select id into v_lot from public.inventory_lots
   where variant_id = p_variant_id and quantity_available > 0
   order by received_at, created_at
   limit 1;
  if v_lot is null then
    raise exception 'No hay stock de ese producto en ningún lote.';
  end if;

  v_date := coalesce(nullif(e.parsed ->> 'sale_date', '')::date, (e.received_at at time zone 'Europe/Madrid')::date);

  v_sale := public.create_sale(jsonb_build_object(
    'sale_date', v_date,
    'responsible_id', v_resp,
    'platform_id', v_platform,
    'mobile_device_id', v_mobile,
    'carrier_id', v_carrier,
    'shipping_status', 'pendiente',
    'notes', 'Detectada en el correo de ' || v_platform_name,
    'items', jsonb_build_array(jsonb_build_object(
      'variant_id', p_variant_id, 'lot_id', v_lot, 'quantity', 1, 'unit_price', v_price))
  ));

  update public.sales
     set source = 'correo',
         source_email_id = e.id,
         buyer_name = nullif(e.parsed ->> 'buyer', ''),
         platform_transaction_id = coalesce(platform_transaction_id, nullif(e.parsed ->> 'transaction_id', ''), nullif(e.parsed ->> 'order_id', '')),
         image_path = coalesce(image_path, nullif(e.parsed ->> 'image_path', ''))
   where id = v_sale;

  update public.email_messages
     set sale_id = v_sale, variant_id = p_variant_id, status = 'procesado', review_reason = null, candidates = null,
         last_error = null, processed_at = now(), resolved_by = case when v_is_user then v_actor end,
         updated_at = now()
   where id = e.id;

  if p_alias is not null and p_alias_norm is not null and length(trim(p_alias_norm)) > 0 then
    insert into public.product_aliases (variant_id, alias, alias_norm, created_by)
    values (p_variant_id, p_alias, p_alias_norm, v_actor)
    on conflict (organization_id, alias_norm) do update set variant_id = excluded.variant_id;
  end if;
  return v_sale;
end;
$$;

-- «Ya estaba apuntada»: además completa la foto y el transportista si faltan
create or replace function public.email_mark_duplicate(p_email_id uuid, p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.email_messages%rowtype;
  s public.sales%rowtype;
  v_platform text;
  v_carrier uuid;
begin
  perform public.require_perm('correo');
  select * into e from public.email_messages where id = p_email_id for update;
  if not found then
    raise exception 'El correo no existe.';
  end if;
  if e.kind not in ('vinted_venta', 'wallapop_venta', 'otra_venta') then
    raise exception 'Este correo no es una venta.';
  end if;
  if e.status = 'procesado' then
    raise exception 'Esta venta ya está confirmada; si sobra, anúlala desde la ficha de la venta.';
  end if;
  if e.status = 'duplicado' and e.sale_id = p_sale_id then
    return;
  end if;
  select * into s from public.sales where id = p_sale_id;
  if not found or s.status <> 'activa' then
    raise exception 'La venta no existe o está anulada.';
  end if;
  select name into v_platform from public.platforms where id = s.platform_id;
  if not private.platform_is(v_platform, e.platform) then
    raise exception 'Esa venta es de otra plataforma.';
  end if;
  if exists (select 1 from public.email_messages where sale_id = p_sale_id and kind in ('vinted_venta', 'wallapop_venta', 'otra_venta') and id <> e.id) then
    raise exception 'Esa venta ya está unida a otro correo.';
  end if;
  if nullif(e.parsed ->> 'carrier_name', '') is not null then
    select id into v_carrier from public.carriers where active and lower(name) = lower(e.parsed ->> 'carrier_name') limit 1;
  end if;

  update public.email_messages
     set status = 'duplicado', sale_id = p_sale_id, review_reason = null, candidates = null, last_error = null,
         processed_at = now(), resolved_by = auth.uid(), updated_at = now()
   where id = e.id;
  -- Completa los datos que falten en la venta (sin pisar nada)
  update public.sales
     set buyer_name = coalesce(buyer_name, nullif(e.parsed ->> 'buyer', '')),
         platform_transaction_id = coalesce(platform_transaction_id, nullif(e.parsed ->> 'transaction_id', ''), nullif(e.parsed ->> 'order_id', '')),
         image_path = coalesce(image_path, nullif(e.parsed ->> 'image_path', '')),
         carrier_id = coalesce(carrier_id, v_carrier)
   where id = p_sale_id;
  perform public.log_action('venta_duplicada', 'sales', p_sale_id::text, 'Venta detectada en el correo marcada como duplicado de ' || s.sale_number);
end;
$$;

