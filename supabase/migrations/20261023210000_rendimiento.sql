-- Rendimiento (medido con 50.000 ventas en 6 espacios; mismo resultado, menos trabajo).
--
-- 1. v_purchase_orders: el coste de mercancía de cada pedido se calculaba
--    pasando dos veces por v_purchase_lines, que reparte los costes de TODOS
--    los pedidos; con 600 pedidos la lista de Compras tardaba ~5 s (crece al
--    cuadrado). Ahora se suma directamente sobre las líneas de ese pedido, con
--    la misma fórmula (cantidad base × coste unitario), en una sola pasada.
-- 2. report_sale_lines: los filtros por identificador se leían del JSON en
--    cada fila (7 llamadas por línea); ahora se leen una vez al empezar. Y la
--    búsqueda de texto y el filtro de envío se aplican sobre las líneas ya
--    filtradas (con 30.000 ventas, buscar un texto podía tardar minutos).

create or replace view public.v_purchase_orders with (security_invoker = true) as
select
  po.id,
  po.order_number,
  po.order_date,
  po.received_at,
  po.status,
  po.supplier_id,
  su.name as supplier_name,
  su.is_placeholder as supplier_is_placeholder,
  po.notes,
  po.created_at,
  it.line_count,
  it.units_ordered,
  it.units_received,
  it.merchandise_cost,
  co.extra_costs,
  it.merchandise_cost + co.extra_costs as total_cost
from public.purchase_orders po
join public.suppliers su on su.id = po.supplier_id
cross join lateral (
  select
    count(*)::integer as line_count,
    coalesce(sum(i.quantity_ordered) filter (where i.substitutes_item_id is null), 0)::integer as units_ordered,
    coalesce(sum(i.quantity_received), 0)::integer as units_received,
    round(coalesce(sum(
      (case
         when po.status = 'recibido' then coalesce(i.quantity_received, 0)
         when po.status = 'cancelado' or i.status = 'cancelado' then 0
         else i.quantity_ordered
       end)::numeric * i.unit_cost), 0), 2) as merchandise_cost
  from public.purchase_order_items i
  where i.purchase_order_id = po.id
) it
cross join lateral (
  select coalesce(sum(c.amount), 0) as extra_costs
  from public.purchase_order_costs c
  where c.purchase_order_id = po.id
) co;

create or replace function public.report_sale_lines(p_filters jsonb default '{}'::jsonb)
returns setof v_sale_lines
language plpgsql
stable
set search_path to 'public'
-- Plan propio por llamada: el plan genérico (tras 5 llamadas) era hasta 3× más lento
set plan_cache_mode to 'force_custom_plan'
as $function$
declare
  f jsonb := coalesce(p_filters, '{}'::jsonb);
  v_from date := private.date_or_null(f, 'from', 'La fecha desde');
  v_to date := private.date_or_null(f, 'to', 'La fecha hasta');
  v_po integer := private.int_or_null(f, 'purchase_order_number', 'El número de pedido');
  v_q text := private.txt(f, 'search');
  v_envio text := private.txt(f, 'shipping_status');
  v_product uuid := private.uuid_or_null(f, 'product_id');
  v_variant uuid := private.uuid_or_null(f, 'variant_id');
  v_category uuid := private.uuid_or_null(f, 'category_id');
  v_brand uuid := private.uuid_or_null(f, 'brand_id');
  v_responsible uuid := private.uuid_or_null(f, 'responsible_id');
  v_platform uuid := private.uuid_or_null(f, 'platform_id');
begin
  perform public.require_perm('costes');
  if v_from is not null and v_to is null then
    v_to := current_date;
  end if;
  -- Primero las líneas que cumplen los filtros simples (fechas, ids); la búsqueda
  -- de texto y el estado del envío se aplican después sobre ese resultado.
  -- Así el planificador no mezcla la búsqueda con las uniones (con muchas
  -- ventas elegía un plan que tardaba minutos).
  return query
  with base as materialized (
    select * from public.v_sale_lines sl
     where (v_from is null or sl.sale_date >= v_from)
       and (v_to is null or sl.sale_date <= v_to)
       and (v_po is null or sl.purchase_order_number = v_po)
       and (v_product is null or sl.product_id = v_product)
       and (v_variant is null or sl.variant_id = v_variant)
       and (v_category is null or sl.category_id = v_category)
       and (v_brand is null or sl.brand_id = v_brand)
       and (v_responsible is null or sl.responsible_id = v_responsible)
       and (v_platform is null or sl.platform_id = v_platform)
  )
  select sl.* from base sl
   where (v_envio is null or exists (
           select 1 from public.sales s
            where s.id = sl.sale_id
              and s.shipping_status is not null
              and private.envio_state(s.shipping_status::text, s.tracking_status, s.delivered_at) = v_envio))
     and (v_q is null or sl.sale_number ilike '%' || v_q || '%' or sl.product_name ilike '%' || v_q || '%'
          or coalesce(sl.external_reference, '') ilike '%' || v_q || '%')
   order by sl.sale_date desc, sl.sale_number desc, sl.line_number;
end;
$function$;

-- Auditoría: la página (últimos 50 de la organización) leía y ordenaba todo el
-- historial; con este índice va directa a las filas.
create index if not exists audit_log_org_occurred_idx
  on public.audit_log (organization_id, occurred_at desc, id desc);
