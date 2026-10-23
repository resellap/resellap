import { msg } from "@/i18n/translate";
import { getT, tSync } from "@/i18n/server";
import type { Metadata } from "next";
import { ExportLinks, FilterBar, type FilterField } from "@/components/filter-bar";
import { Empty, Figures, Notice, PageHeader, Pagination, Panel, Table, Tabs, Td, Th, Tr } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { filtersFrom, first, pageFrom, toQuery, type SearchParams } from "@/lib/filters";
import { date, money, percent, units } from "@/lib/format";
import { loadCatalogOptions, loadSaleOptions, loadSuppliers } from "@/lib/options";
import { REPORTS, type Column, type ReportType } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";
import { ShippingReport } from "./shipping-report";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Informes") };
}

function fmt(c: Column, r: Record<string, unknown>) {
  const v = c.value(r);
  if (v === null || v === undefined || v === "") return "—";
  switch (c.kind) {
    case "date":
      return date(String(v));
    case "money":
      return money(Number(v));
    case "money4":
      return money(Number(v), { precise: true });
    case "int":
      return units(Number(v));
    case "pct":
      return percent(Number(v));
    default:
      if (c.tr && typeof v === "string") return tSync()(v);
      return String(v);
  }
}

const TABS: { key: ReportType; label: string }[] = [
  { key: "ventas", label: msg("Ventas") },
  { key: "inventario", label: msg("Inventario") },
  { key: "compras", label: msg("Compras") },
  { key: "responsables", label: msg("Responsables") },
  { key: "salidas", label: msg("Salidas sin venta") },
];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  await requirePerm("costes");
  const sp = await searchParams;
  if (first(sp.tab) === "envios") {
    const f = filtersFrom(sp);
    const d = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
    return (
      <>
        <PageHeader title={t("Informes")} description={t("Envíos y tiempos de entrega por transportista, con los datos del seguimiento.")} />
        <Tabs current="envios" items={[...TABS.map((x) => ({ key: x.key as string, label: t(x.label), href: `/informes?tab=${x.key}` })), { key: "envios", label: t("Envíos"), href: "/informes?tab=envios" }]} />
        <FilterBar
          basePath="/informes?tab=envios"
          values={f}
          fields={[
            { type: "date", name: "from", label: t("Enviados desde") },
            { type: "date", name: "to", label: t("Hasta") },
          ]}
          extra={<input type="hidden" name="tab" value="envios" />}
        />
        <ShippingReport from={d(f.from)} to={d(f.to)} />
      </>
    );
  }
  const tab = (TABS.find((t) => t.key === first(sp.tab))?.key ?? "ventas") as ReportType;
  const filters = filtersFrom(sp);
  const { page, from, to, size } = pageFrom(sp, 100);
  const report = REPORTS[tab];
  const supabase = await createClient();
  const [sale, cat, suppliers, { data: products }] = await Promise.all([
    loadSaleOptions(),
    loadCatalogOptions(),
    loadSuppliers(),
    supabase.from("products").select("id, name").is("deleted_at", null).order("name").limit(2000),
  ]);
  const productOpts = (products ?? []).map((p) => ({ value: p.id, label: p.name }));
  const catOpts = cat.categories.map((c) => ({ value: c.id, label: c.name }));

  const fieldsByTab: Record<ReportType, FilterField[]> = {
    ventas: [
      { type: "date", name: "from", label: t("Desde") },
      { type: "date", name: "to", label: t("Hasta") },
      { type: "number", name: "purchase_order_number", label: t("Pedido/lote nº") },
      { type: "select", name: "product_id", label: t("Producto"), options: productOpts },
      { type: "select", name: "category_id", label: t("Categoría"), empty: t("Todas"), options: catOpts },
      { type: "select", name: "responsible_id", label: t("Responsable"), options: sale.responsibles.map((r) => ({ value: r.id, label: r.name })) },
      { type: "select", name: "platform_id", label: t("Plataforma"), empty: t("Todas"), options: sale.platforms.map((p) => ({ value: p.id, label: p.name })) },
    ],
    inventario: [
      { type: "text", name: "search", label: t("Producto"), placeholder: t("Nombre o SKU") },
      { type: "select", name: "category_id", label: t("Categoría"), empty: t("Todas"), options: catOpts },
      { type: "select", name: "brand_id", label: t("Marca"), empty: t("Todas"), options: cat.brands.map((b) => ({ value: b.id, label: b.name })) },
      { type: "number", name: "purchase_order_number", label: t("Pedido/lote nº") },
      { type: "checkbox", name: "only_in_stock", label: t("Solo con stock") },
    ],
    compras: [
      { type: "date", name: "from", label: t("Desde") },
      { type: "date", name: "to", label: t("Hasta") },
      { type: "number", name: "purchase_order_number", label: t("Nº pedido") },
      { type: "select", name: "supplier_id", label: t("Proveedor"), options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
      { type: "select", name: "product_id", label: t("Producto"), options: productOpts },
    ],
    responsables: [
      { type: "date", name: "from", label: t("Desde") },
      { type: "date", name: "to", label: t("Hasta") },
      { type: "number", name: "purchase_order_number", label: t("Pedido/lote nº") },
      { type: "select", name: "product_id", label: t("Producto"), options: productOpts },
      { type: "select", name: "category_id", label: t("Categoría"), empty: t("Todas"), options: catOpts },
    ],
    salidas: [],
  };

  const query =
    tab === "salidas"
      ? supabase.from("v_stock_exits").select("*", { count: "exact" }).eq("status", "activa").order("exit_date", { ascending: false }).range(from, to)
      : supabase.rpc(report.rpc, { p_filters: filters }, { count: "exact" }).range(from, to);
  const [{ data, count, error }, summary] = await Promise.all([
    query,
    tab === "ventas"
      ? supabase.rpc("report_sales_summary", { p_filters: filters })
      : tab === "inventario"
        ? supabase.rpc("report_inventory_summary", { p_filters: filters })
        : Promise.resolve({ data: null }),
  ]);
  const rows = (data ?? []) as Record<string, unknown>[];
  const s = summary.data as Record<string, number> | null;

  return (
    <>
      <PageHeader title={t("Informes")} description={t("Todos se pueden exportar a Excel o CSV con los filtros aplicados.")} />
      <Tabs current={tab} items={[...TABS.map((x) => ({ key: x.key as string, label: t(x.label), href: `/informes?tab=${x.key}` })), { key: "envios", label: t("Envíos"), href: "/informes?tab=envios" }]} />
      <FilterBar
        basePath={`/informes?tab=${tab}`}
        values={filters}
        fields={[...fieldsByTab[tab]]}
        extra={
          <>
            <input type="hidden" name="tab" value={tab} />
            <ExportLinks type={tab} filters={filters} />
          </>
        }
      />
      {error && <Notice tone="bad">{error.message}</Notice>}
      {tab === "ventas" && s && (
        <Figures
          className="mb-4"
          items={[
            { label: t("Pedidos"), value: units(s.orders) },
            { label: t("Unidades"), value: units(s.units) },
            { label: t("Facturación"), value: money(s.net_amount) },
            { label: t("Coste (de cada lote)"), value: money(s.cost_amount) },
            { label: t("Beneficio"), value: money(s.profit), tone: s.profit < 0 ? "bad" : "good" },
          ]}
        />
      )}
      {tab === "inventario" && s && (
        <Figures
          className="mb-4"
          items={[
            { label: t("Unidades"), value: units(s.units) },
            { label: t("Valor almacén"), value: money(s.stock_value) },
            { label: t("Valor potencial"), value: money(s.potential_value) },
            { label: t("Beneficio potencial"), value: money(s.potential_profit), tone: "good" },
          ]}
        />
      )}
      <Panel padded={false}>
        {rows.length === 0 ? (
          <Empty title={t("No hay datos con estos filtros")} />
        ) : (
          <Table>
            <thead>
              <tr>
                {report.columns.map((c) => (
                  <Th key={c.key} num={c.kind !== "text" && c.kind !== "date"}>
                    {t(c.label)}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <Tr key={i}>
                  {report.columns.map((c) => (
                    <Td key={c.key} num={c.kind !== "text" && c.kind !== "date"} className={c.kind === "date" ? "num" : c.key.endsWith("_number") || c.key === "lot_label" ? "whitespace-nowrap" : undefined}>
                      {fmt(c, r)}
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} size={size} total={count ?? 0} hrefFor={(p) => `/informes${toQuery({ ...filters, tab, page: p })}`} />
      </Panel>
    </>
  );
}
