import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { ExportLinks, FilterBar } from "@/components/filter-bar";
import { POStatus } from "@/components/badges";
import { Badge, Empty, LinkButton, LotTag, Notice, PageHeader, Pagination, Panel, Table, Td, Th, Tr } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { filtersFrom, pageFrom, toQuery, type SearchParams } from "@/lib/filters";
import { PO_STATUS, date, money, units } from "@/lib/format";
import { loadSuppliers } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: msg("Compras") };

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  await requirePerm("compras");
  const sp = await searchParams;
  const filters = filtersFrom(sp);
  const { page, from, to, size } = pageFrom(sp, 50);
  const supabase = await createClient();
  const suppliers = await loadSuppliers();
  let q = supabase.from("v_purchase_orders").select("*", { count: "exact" });
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.supplier_id) q = q.eq("supplier_id", filters.supplier_id);
  if (filters.from) q = q.gte("order_date", filters.from);
  if (filters.to) q = q.lte("order_date", filters.to);
  if (filters.purchase_order_number) q = q.eq("order_number", Number(filters.purchase_order_number) || 0);
  const { data, count, error } = await q.order("order_number", { ascending: false }).range(from, to);

  return (
    <>
      <PageHeader
        title={t("Compras")}
        description={t("Pedidos de compra. Cada línea recibida se convierte en un lote con su coste real.")}
        actions={<LinkButton href="/compras/nuevo" variant="primary">{t("Nuevo pedido")}</LinkButton>}
      />
      <FilterBar
        basePath="/compras"
        values={filters}
        fields={[
          { type: "number", name: "purchase_order_number", label: t("Nº pedido") },
          { type: "date", name: "from", label: t("Desde") },
          { type: "date", name: "to", label: t("Hasta") },
          { type: "select", name: "supplier_id", label: t("Proveedor"), options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
          { type: "select", name: "status", label: t("Estado"), options: Object.entries(PO_STATUS).map(([value, label]) => ({ value, label })) },
        ]}
        extra={<ExportLinks type="compras" filters={filters} />}
      />
      {error && <Notice tone="bad">{error.message}</Notice>}
      <Panel padded={false}>
        {(data ?? []).length === 0 ? (
          <Empty title={t("No hay pedidos de compra")} action={<LinkButton href="/compras/nuevo">{t("Crear el primero")}</LinkButton>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("Pedido")}</Th>
                <Th>{t("Fecha")}</Th>
                <Th>{t("Proveedor")}</Th>
                <Th>{t("Estado")}</Th>
                <Th num>{t("Líneas")}</Th>
                <Th num>{t("Uds. pedidas")}</Th>
                <Th num>{t("Uds. recibidas")}</Th>
                <Th num>{t("Mercancía")}</Th>
                <Th num>{t("Costes extra")}</Th>
                <Th num>{t("Coste total")}</Th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((po) => (
                <Tr key={po.id} muted={po.status === "cancelado"}>
                  <Td>
                    <Link href={`/compras/${po.id}`}>
                      <LotTag label={t("Pedido #{order_number}", { order_number: po.order_number })} />
                    </Link>
                  </Td>
                  <Td className="num">{date(po.order_date)}</Td>
                  <Td>{po.supplier_is_placeholder ? <Badge tone="warn">{t("Proveedor pendiente")}</Badge> : po.supplier_name}</Td>
                  <Td>
                    <POStatus status={po.status} />
                  </Td>
                  <Td num>{po.line_count}</Td>
                  <Td num>{units(po.units_ordered)}</Td>
                  <Td num>{po.status === "recibido" ? units(po.units_received) : "—"}</Td>
                  <Td num>{money(po.merchandise_cost)}</Td>
                  <Td num>{money(po.extra_costs)}</Td>
                  <Td num className="font-semibold">
                    {money(po.total_cost)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} size={size} total={count ?? 0} hrefFor={(p) => `/compras${toQuery({ ...filters, page: p })}`} />
      </Panel>
    </>
  );
}
