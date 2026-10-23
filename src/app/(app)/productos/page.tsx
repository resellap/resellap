import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { BubbleGroup } from "@/components/liquid";
import { ExportLinks, FilterBar } from "@/components/filter-bar";
import { Badge, Empty, Figures, LinkButton, Notice, PageHeader, Pagination, Panel, StockBadge, Table, Td, Th, Tr } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { filtersFrom, first, pageFrom, toQuery, type SearchParams } from "@/lib/filters";
import { money, percent, units } from "@/lib/format";
import { loadCatalogOptions } from "@/lib/options";
import { must } from "@/lib/db";
import { PRODUCT_COLUMNS, PRODUCT_SORTS, type ProductSort } from "@/lib/preferences";
import { loadPrefs } from "@/lib/user-prefs";
import { signPhotos } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { type SellableVariant, variantDisplay } from "@/lib/types";
import { ProductCards, ProductThumb } from "./product-cards";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Inventario") };
}

type ProductRow = {
  product_id: string;
  product_name: string;
  brand_name: string | null;
  category_name: string | null;
  photo_path: string | null;
  sku: string | null;
  normal_sale_price: number | null;
  variant_count: number;
  stock: number;
  stock_value: number;
  weighted_avg_cost: number | null;
  units_sold: number;
  avg_sale_price: number | null;
  has_missing_data: boolean;
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  const user = await requireUser();
  const sp = await searchParams;
  const supabase = await createClient();
  // Lista completa (valor de almacén, costes) con «costes»; crear productos con «productos»
  const isAdmin = can(user, "costes");
  const canCreate = can(user, "catalogo");

  if (!isAdmin) {
    const q = first(sp.search) ?? "";
    const data = must(await supabase.rpc("search_sellable_variants", { p_query: q || null, p_only_in_stock: first(sp.only_in_stock) === "true", p_limit: 200 }), "los productos");
    const rows = (data ?? []) as SellableVariant[];
    const sellerPhotos = await signPhotos(rows.map((r) => r.photo_path), { thumbs: true });
    return (
      <>
        <PageHeader
          title={t("Inventario")}
          description={t("Stock disponible y precio normal de cada producto.")}
          actions={
            canCreate ? (
              <LinkButton href="/productos/nuevo" variant="primary">
                {t("Nuevo producto")}
              </LinkButton>
            ) : undefined
          }
        />
        <FilterBar
          basePath="/productos"
          values={{ search: q, only_in_stock: first(sp.only_in_stock) }}
          fields={[
            { type: "text", name: "search", label: t("Buscar"), placeholder: t("Nombre, marca o SKU") },
            { type: "checkbox", name: "only_in_stock", label: t("Solo con stock") },
          ]}
        />
        <ProductCards
          items={rows.map((v) => ({
            key: v.variant_id,
            href: `/productos/${v.product_id}`,
            name: variantDisplay(v.product_name, v.variant_name, v.variant_count),
            subtitle: [v.brand_name, v.sku].filter(Boolean).join(" · ") || "—",
            photo: v.photo_path ? sellerPhotos.get(v.photo_path) : undefined,
            stock: v.stock,
            price: v.normal_sale_price,
          }))}
        />
        <Panel padded={false} className={rows.length ? "max-lg:hidden" : undefined}>
          {rows.length === 0 ? (
            <Empty title={t("No hay productos con esa búsqueda")} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("Producto")}</Th>
                  <Th>{t("Marca")}</Th>
                  <Th>{t("SKU")}</Th>
                  <Th num>{t("Stock")}</Th>
                  <Th num>{t("Precio")}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <Tr key={v.variant_id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <ProductThumb url={v.photo_path ? sellerPhotos.get(v.photo_path) : undefined} size={40} />
                        <Link href={`/productos/${v.product_id}`} className="font-semibold hover:underline">
                          {variantDisplay(v.product_name, v.variant_name, v.variant_count)}
                        </Link>
                      </div>
                    </Td>
                    <Td>{v.brand_name ?? "—"}</Td>
                    <Td>{v.sku ?? "—"}</Td>
                    <Td num>
                      <StockBadge stock={v.stock} />
                    </Td>
                    <Td num>{money(v.normal_sale_price)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </>
    );
  }

  const filters = filtersFrom(sp);
  const missing = first(sp.missing) === "true" || first(sp.estado) === "pendientes";
  // Preferencias de la tabla (Ajustes → Tablas): columnas, orden y filas por página
  const tp = (await loadPrefs()).tables.productos;
  const low = Number(first(sp.bajo));
  const lowStock = Number.isInteger(low) && low >= 1 && low <= 1000 ? low : null;
  const sortKey: ProductSort = Object.hasOwn(PRODUCT_SORTS, first(sp.orden) ?? "") ? (first(sp.orden) as ProductSort) : tp.sort;
  const { page, from, to, size } = pageFrom(sp, tp.pageSize);
  let q = supabase.from("v_product_inventory").select("*", { count: "exact" });
  if (filters.search) q = q.or(`product_name.ilike.%${filters.search.replace(/[%,()]/g, " ")}%,sku.ilike.%${filters.search.replace(/[%,()]/g, " ")}%`);
  if (filters.category_id) q = q.eq("category_id", filters.category_id);
  if (filters.brand_id) q = q.eq("brand_id", filters.brand_id);
  const estado = first(sp.estado) ?? "";
  if (filters.only_in_stock === "true" || estado === "stock") q = q.gt("stock", 0);
  if (estado === "sin") q = q.lte("stock", 0);
  if (missing) q = q.eq("has_missing_data", true);
  if (lowStock) q = q.gte("stock", 1).lte("stock", lowStock);
  // Pedido/lote nº: los productos que entraron en ese pedido de compra
  const po = Number(filters.purchase_order_number);
  if (filters.purchase_order_number) {
    const { data: inPo } = Number.isInteger(po) && po > 0
      ? await supabase.from("v_variant_inventory").select("product_id").contains("purchase_order_numbers", [po])
      : { data: [] };
    const ids = [...new Set((inPo ?? []).map((r) => r.product_id as string))];
    q = q.in("product_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }
  q =
    sortKey === "nombre"
      ? q.order("product_name")
      : sortKey === "recientes"
        ? q.order("created_at", { ascending: false })
        : sortKey === "valor"
          ? q.order("stock_value", { ascending: false, nullsFirst: false })
          : sortKey === "vendidas"
            ? q.order("units_sold", { ascending: false, nullsFirst: false })
            : q.order("stock", { ascending: false });
  const head = () => supabase.from("v_product_inventory").select("product_id", { count: "exact", head: true });
  const [{ data, count, error }, opts, summary, all, inStock, missingN] = await Promise.all([
    q.order("product_name").order("product_id").range(from, to),
    loadCatalogOptions(),
    supabase.rpc("report_inventory_summary", { p_filters: {} }),
    head(),
    head().gt("stock", 0),
    head().eq("has_missing_data", true),
  ]);
  const sum = (summary.data ?? null) as { units?: number; stock_value?: number; potential_value?: number; potential_profit?: number } | null;
  const chips = [
    { key: "", label: t("Todos"), n: all.count ?? 0 },
    { key: "stock", label: t("En stock"), n: inStock.count ?? 0 },
    { key: "sin", label: t("Sin stock"), n: Math.max(0, (all.count ?? 0) - (inStock.count ?? 0)) },
    { key: "pendientes", label: t("Datos pendientes"), n: missingN.count ?? 0 },
  ];
  const cols = tp.columns.filter((c) => c.visible).map((c) => c.key);
  const rows = (data ?? []) as ProductRow[];
  const photos = await signPhotos(rows.map((r) => r.photo_path), { thumbs: true });
  const hrefFor = (p: number) =>
    `/productos${toQuery({ ...filters, missing: first(sp.missing) === "true" ? "true" : undefined, estado: first(sp.estado), bajo: lowStock ? String(lowStock) : undefined, orden: first(sp.orden), page: p })}`;
  const refPrice = (r: ProductRow) => (r.normal_sale_price !== null ? Number(r.normal_sale_price) : r.avg_sale_price !== null ? Number(r.avg_sale_price) : null);
  const profitOf = (r: ProductRow) => {
    const p = refPrice(r);
    return p !== null && r.weighted_avg_cost !== null ? p - Number(r.weighted_avg_cost) : null;
  };
  const marginOf = (r: ProductRow) => {
    const p = refPrice(r);
    const b = profitOf(r);
    return p && b !== null ? (b / p) * 100 : null;
  };

  return (
    <>
      <PageHeader
        title={t("Inventario")}
        description={t("Todo lo que tienes: stock, lo que te costó, a cuánto lo vendes y lo que ganas con cada producto.")}
        actions={
          canCreate ? (
            <LinkButton href="/productos/nuevo" variant="primary">
              {t("Nuevo producto")}
            </LinkButton>
          ) : undefined
        }
      />
      {sum && (
        <Figures
          className="mb-4"
          items={[
            { label: t("Stock disponible"), value: `${units(sum.units ?? 0)} uds.`, note: t("{v} productos con stock", { v: inStock.count ?? 0 }) },
            { label: t("Valor del inventario"), value: money(sum.stock_value ?? 0), note: t("a lo que te costó") },
            { label: t("Valor de venta"), value: money(sum.potential_value ?? 0), note: t("a tu precio normal") },
            { label: t("Beneficio potencial"), value: money(sum.potential_profit ?? 0), tone: "good" },
          ]}
        />
      )}
      <BubbleGroup
        label={t("Estado del stock")}
        active={first(sp.estado) ?? ""}
        className="rs-card no-scrollbar mb-3 flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-[12px] bg-surface p-1"
      >
        {chips.map((c) => {
          const on = (first(sp.estado) ?? "") === c.key;
          return (
            <Link
              key={c.key || "todos"}
              href={`/productos${toQuery({ ...filters, only_in_stock: undefined, estado: c.key || undefined, orden: first(sp.orden) })}`}
              aria-current={on ? "page" : undefined}
              data-bubble={c.key}
              data-on={String(on)}
              className="rs-seg press inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[8px] px-3.5 text-[13.5px] font-medium"
            >
              {c.label}
              <span className="rs-seg-sub num text-[12px]">{c.n}</span>
            </Link>
          );
        })}
      </BubbleGroup>
      <FilterBar
        basePath="/productos"
        values={{ ...filters, orden: first(sp.orden) }}
        keep={{ estado: first(sp.estado) }}
        fields={[
          { type: "text", name: "search", label: t("Buscar"), placeholder: t("Nombre o SKU") },
          { type: "select", name: "category_id", label: t("Categoría"), empty: t("Todas"), options: opts.categories.map((c) => ({ value: c.id, label: c.name })) },
          { type: "select", name: "brand_id", label: t("Marca"), empty: t("Todas"), options: opts.brands.map((c) => ({ value: c.id, label: c.name })) },
          { type: "number", name: "purchase_order_number", label: t("Pedido/lote nº") },
          { type: "select", name: "orden", label: t("Ordenar"), empty: t(PRODUCT_SORTS[tp.sort]), options: (Object.keys(PRODUCT_SORTS) as ProductSort[]).filter((k) => k !== tp.sort).map((k) => ({ value: k, label: PRODUCT_SORTS[k] })) },
        ]}
        extra={<ExportLinks type="inventario" filters={estado === "stock" ? { ...filters, only_in_stock: "true" } : filters} />}
      />
      {error && <Notice tone="bad">{error.message}</Notice>}
      {lowStock && (
        <Notice tone="info" className="mb-3">
          {t("Mostrando productos con stock bajo (entre 1 y {lowStock}", { lowStock })}{" "}{lowStock === 1 ? "unidad" : "unidades"}).{" "}
          <Link href="/productos">{t("Ver todos")}</Link>
        </Notice>
      )}
      <ProductCards
        items={rows.map((r) => ({
          key: r.product_id,
          href: `/productos/${r.product_id}`,
          name: r.product_name,
          subtitle: [r.brand_name ?? "Marca pendiente", r.category_name, r.variant_count > 1 ? `${r.variant_count} variantes` : null]
            .filter(Boolean)
            .join(" · "),
          photo: r.photo_path ? photos.get(r.photo_path) : undefined,
          stock: r.stock,
          price: refPrice(r),
          extra: [
            { label: t("Coste"), value: money(r.weighted_avg_cost) },
            ...(profitOf(r) !== null ? [{ label: t("Gana"), value: money(profitOf(r)) }] : []),
            ...(marginOf(r) !== null ? [{ label: t("Margen"), value: percent(marginOf(r)) }] : []),
          ],
          warn: r.has_missing_data ? "Datos pendientes" : null,
        }))}
      />
      <Panel padded={false} className={rows.length ? "max-lg:mt-3 max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none" : undefined}>
        {rows.length === 0 ? (
          <Empty title={t("No hay productos con estos filtros")} action={canCreate ? <LinkButton href="/productos/nuevo">{t("Crear producto")}</LinkButton> : undefined} />
        ) : (
          <Table className="max-lg:hidden">
            <thead>
              <tr>
                {cols.map((c) => (
                  <Th key={c} num={c !== "producto" && c !== "categoria"}>
                    {t(PRODUCT_COLUMNS[c])}
                  </Th>
                ))}
                <Th num>{t("Beneficio")}</Th>
                <Th num>{t("Margen")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.product_id} muted={r.stock <= 0}>
                  {cols.map((c) => {
                    switch (c) {
                      case "producto":
                        return (
                          <Td key={c}>
                            <div className="flex items-center gap-3">
                              <ProductThumb url={r.photo_path ? photos.get(r.photo_path) : undefined} size={40} />
                              <div className="min-w-0">
                                <Link href={`/productos/${r.product_id}`} className="font-semibold text-ink hover:underline">
                                  {r.product_name}
                                </Link>
                                <span className="block text-xs text-muted">
                                  {[r.brand_name ?? "Marca pendiente", r.sku ?? "Sin SKU", r.variant_count > 1 ? `${r.variant_count} variantes` : null]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            </div>
                          </Td>
                        );
                      case "categoria":
                        return <Td key={c}>{r.category_name ?? <Badge tone="warn">{t("Pendiente")}</Badge>}</Td>;
                      case "stock":
                        return (
                          <Td key={c} num>
                            <StockBadge stock={r.stock} />
                          </Td>
                        );
                      case "coste":
                        return <Td key={c} num>{money(r.weighted_avg_cost)}</Td>;
                      case "precio":
                        return <Td key={c} num>{r.normal_sale_price !== null ? money(r.normal_sale_price) : <span className="text-faint">—</span>}</Td>;
                      case "precio_medio":
                        return <Td key={c} num>{money(r.avg_sale_price)}</Td>;
                      case "vendidas":
                        return <Td key={c} num>{units(r.units_sold)}</Td>;
                      case "valor":
                        return <Td key={c} num>{money(r.stock_value)}</Td>;
                    }
                  })}
                  <Td num className={profitOf(r) !== null && profitOf(r)! < 0 ? "text-danger" : "font-semibold text-good-ink"}>
                    {profitOf(r) !== null ? money(profitOf(r)) : <span className="font-normal text-faint">—</span>}
                  </Td>
                  <Td num>{marginOf(r) !== null ? percent(marginOf(r)) : <span className="text-faint">—</span>}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} size={size} total={count ?? 0} hrefFor={hrefFor} />
      </Panel>
    </>
  );
}
