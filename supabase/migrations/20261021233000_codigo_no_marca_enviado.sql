-- Poner o cambiar el código de seguimiento ya no marca la venta como enviada:
-- se queda pendiente hasta que la persona la marque como enviada.

create or replace function public.update_tracking(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sales%rowtype := private.require_shipping_access(private.uuid_or_null(p, 'id'));
  v_number text;
  v_status text := nullif(p ->> 'status', '');
begin
  if s.status <> 'activa' then
    raise exception 'La venta está anulada.';
  end if;
  if p ? 'tracking_number' then
    v_number := nullif(upper(regexp_replace(coalesce(p ->> 'tracking_number', ''), '\s+', '', 'g')), '');
    if v_number is not null and v_number !~ '^[A-Z0-9-]{4,40}$' then
      raise exception 'El código de seguimiento solo puede tener letras, números y guiones (de 4 a 40).';
    end if;
    if v_number is distinct from s.tracking_number then
      update public.sales
         set tracking_number = v_number, tracking_registered_at = null, tracking_error = null, tracking_checked_at = null
       where id = s.id;
    end if;
    -- El código NO marca la venta como enviada: eso lo decide la persona.
    -- Solo si ya estaba «enviado» sin hora de envío, el seguimiento empieza ahora.
    if v_number is not null and s.shipping_status = 'enviado' and s.shipped_at is null and s.delivered_at is null then
      update public.sales
         set shipped_at = now(),
             tracking_status = case when tracking_status is null or tracking_status = 'pendiente' then 'enviado' else tracking_status end,
             tracking_status_at = case when tracking_status is null or tracking_status = 'pendiente' then now() else tracking_status_at end
       where id = s.id;
      s.shipped_at := now();
    end if;
  end if;
  if p ? 'carrier_id' then
    if private.uuid_or_null(p, 'carrier_id') is not null
       and not exists (select 1 from public.carriers where id = private.uuid_or_null(p, 'carrier_id')) then
      raise exception 'El transportista no existe.';
    end if;
    update public.sales set carrier_id = private.uuid_or_null(p, 'carrier_id') where id = s.id;
  end if;
  if v_status is not null then
    if s.shipped_at is null and s.shipping_status <> 'enviado' then
      raise exception 'Primero marca la venta como enviada.';
    end if;
    perform private.tracking_set_status(s.id, v_status, nullif(p ->> 'note', ''), null, now(), 'manual');
  end if;
end;
$$;
