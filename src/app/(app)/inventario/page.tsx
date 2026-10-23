import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { ExportLinks, FilterBar } from "@/components/filter-bar";
import { Empty, Figures, LinkButton, LotTag, Notice, PageHeader, Pagination, Panel, StockBadge, Table, Td, Th, Tr } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { filtersFrom, pageFrom, toQuery, type SearchParams } from "@/lib/filters";
import { money, units } from "@/lib/format";
import { loadCatalogOptions } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import { variantDisplay } from "@/lib/types";

export const metadata: Metadata = { title: msg("Inventario") };

type Row = {
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  variant_count: number;
  sku: string | null;
  category_name: string | null;
  brand_name: string | null;
  stock: number;
  weighted_avg_cost: number | null;
  stock_value: number;
  normal_sale_price: number | null;
  avg_sale_price: number | null;
  potential_unit_price: number | null;
  potential_is_estimated: boolean;
  potential_value: number | null;
  potential_profit: number | null;
  units_sold: number;
  lot_labels: string[];
};

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  await requirePerm("costes");
  const sp = await searchParams;
  const filters = filtersFrom(sp);
  const { page, from, to, size } = pageFrom(sp, 60);
  const supabase = await createClient();
  const [opts, list, sum] = await Promise.all([
    loadCatalogOptions(),
    supabase.rpc("report_inventory", { p_filters: filters }, { count: "exact" }).range(from, to),
    supabase.rpc("report_inventory_summary", { p_filters: filters }),
  ]);
  const rows = (list.data ?? []) as Row[];
  const s = sum.data as { units: number; products_with_stock: number; stock_value: number; potential_value: number; potential_profit: number; weighted_avg_cost: number | null; unpriced_units: number; estimated_units: number } | null;

  return (
    <>
      <PageHeader
        title={t("Inventario y lotes")}
        description={t("El valor del almacén usa el coste medio ponderado de las unidades que quedan. El beneficio de cada venta usa el coste real de su lote.")}
        actions={<LinkButton href="/salidas">{t("Ajustes y salidas sin venta")}</LinkButton>}
      />
      <FilterBar
        basePath="/inventario"
        values={filters}
        fields={[
          { type: "text", name: "search", label: t("Producto o variante"), placeholder: t("Nombre o SKU") },
          { type: "select", name: "category_id", label: t("Categoría"), empty: t("Todas"), options: opts.categories.map((c) => ({ value: c.id, label: c.name })) },
          { type: "select", name: "brand_id", label: t("Marca"), empty: t("Todas"), options: opts.brands.map((c) => ({ value: c.id, label: c.name })) },
          { type: "number", name: "purchase_order_number", label: t("Pedido/lote nº") },
          { type: "checkbox", name: "only_in_stock", label: t("Solo con stock") },
        ]}
        extra={<ExportLinks type="inventario" filters={filters} />}
      />
      {list.error && <Notice tone="bad">{list.error.message}</Notice>}
      {s && (
        <Figures
          className="mb-4"
          items={[
            { label: t("Unidades"), value: units(s.units), note: t("{products_with_stock} productos con stock", { products_with_stock: units(s.products_with_stock) }) },
            { label: t("Coste medio ponderado"), value: money(s.weighted_avg_cost, { precise: true }) },
            { label: t("Valor del almacén"), value: money(s.stock_value) },
            {
              label: t("Valor potencial de venta"),
              value: money(s.potential_value),
              note: s.estimated_units || s.unpriced_units ? t("{estimated_units} uds. con precio medio, {unpriced_units} sin precio", { estimated_units: s.estimated_units, unpriced_units: s.unpriced_units }) : undefined,
            },
            { label: t("Beneficio potencial"), value: money(s.potential_profit), tone: "good" },
          ]}
        />
      )}
      <Panel padded={false}>
        {rows.length === 0 ? (
          <Empty title={t("No hay productos con estos filtros")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("Producto")}</Th>
                <Th>{t("SKU")}</Th>
                <Th num>{t("Stock")}</Th>
                <Th num>{t("Coste medio")}</Th>
                <Th num>{t("Valor almacén")}</Th>
                <Th num>{t("Precio venta")}</Th>
                <Th num>{t("Valor potencial")}</Th>
                <Th num>{t("Beneficio pot.")}</Th>
                <Th num>{t("Vendidas")}</Th>
                <Th>{t("Lotes con stock")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.variant_id} muted={r.stock <= 0}>
                  <Td>
                    <Link href={`/productos/${r.product_id}`} className="font-semibold text-ink hover:underline">
                      {variantDisplay(r.product_name, r.variant_name, r.variant_count)}
                    </Link>
                    <span className="block text-xs text-muted">{[r.brand_name, r.category_name].filter(Boolean).join(", ")}</span>
                  </Td>
                  <Td>{r.sku ?? "—"}</Td>
                  <Td num>
                    <StockBadge stock={r.stock} />
                  </Td>
                  <Td num>{money(r.weighted_avg_cost, { precise: true })}</Td>
                  <Td num>{money(r.stock_value)}</Td>
                  <Td num>
                    {r.potential_unit_price !== null ? money(r.potential_unit_price) : <span className="text-faint">{t("Sin precio")}</span>}
                    {r.potential_is_estimated && <span className="block text-xs text-muted">{t("precio medio")}</span>}
                  </Td>
                  <Td num>{money(r.potential_value)}</Td>
                  <Td num>{money(r.potential_profit)}</Td>
                  <Td num>{units(r.units_sold)}</Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {r.lot_labels.map((l, i) => (
                        <LotTag key={i} label={l} />
                      ))}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} size={size} total={list.count ?? 0} hrefFor={(p) => `/inventario${toQuery({ ...filters, page: p })}`} />
      </Panel>
    </>
  );
}
