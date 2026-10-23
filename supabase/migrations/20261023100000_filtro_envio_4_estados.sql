-- Ventas: el filtro «Envío» tiene 4 estados (pendiente de envío, enviado,
-- en reparto, entregado). Una vez marcada como enviada, el estado sale de
-- 17TRACK (tracking_status) y de la fecha de entrega.

create or replace function private.envio_state(p_shipping text, p_tracking text, p_delivered timestamptz)
returns text
language sql
immutable
as $$
  select case
    when p_shipping is distinct from 'enviado' then 'pendiente'
    when p_delivered is not null or p_tracking = 'entregado' then 'entregado'
    when p_tracking = 'en_reparto' then 'en_reparto'
    else 'enviado'
  end;
$$;

create or replace function public.report_sale_lines(p_filters jsonb default '{}'::jsonb)
returns setof v_sale_lines
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  f jsonb := coalesce(p_filters, '{}'::jsonb);
  v_from date := private.date_or_null(f, 'from', 'La fecha desde');
  v_to date := private.date_or_null(f, 'to', 'La fecha hasta');
  v_po integer := private.int_or_null(f, 'purchase_order_number', 'El número de pedido');
  v_q text := private.txt(f, 'search');
  v_envio text := private.txt(f, 'shipping_status');
begin
  perform public.require_perm('costes');
  if v_from is not null and v_to is null then
    v_to := current_date;
  end if;
  return query
  select sl.* from public.v_sale_lines sl
   where (v_from is null or sl.sale_date >= v_from)
     and (v_to is null or sl.sale_date <= v_to)
     and (v_po is null or sl.purchase_order_number = v_po)
     and (private.uuid_or_null(f, 'product_id') is null or sl.product_id = private.uuid_or_null(f, 'product_id'))
     and (private.uuid_or_null(f, 'variant_id') is null or sl.variant_id = private.uuid_or_null(f, 'variant_id'))
     and (private.uuid_or_null(f, 'category_id') is null or sl.category_id = private.uuid_or_null(f, 'category_id'))
     and (private.uuid_or_null(f, 'brand_id') is null or sl.brand_id = private.uuid_or_null(f, 'brand_id'))
     and (private.uuid_or_null(f, 'responsible_id') is null or sl.responsible_id = private.uuid_or_null(f, 'responsible_id'))
     and (private.uuid_or_null(f, 'platform_id') is null or sl.platform_id = private.uuid_or_null(f, 'platform_id'))
     and (v_envio is null or exists (
           select 1 from public.sales s
            where s.id = sl.sale_id
              and s.shipping_status is not null
              and private.envio_state(s.shipping_status::text, s.tracking_status, s.delivered_at) = v_envio))
     and (v_q is null or sl.sale_number ilike '%' || v_q || '%' or sl.product_name ilike '%' || v_q || '%'
          or coalesce(sl.external_reference, '') ilike '%' || v_q || '%')
   order by sl.sale_date desc, sl.sale_number desc, sl.line_number;
end;
$function$;
