import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/filter-bar";
import { Badge, Empty, Figures, LinkButton, PageHeader, Panel, Table, Td, Th, Tr } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { filtersFrom, type SearchParams } from "@/lib/filters";
import { date, money, units } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { variantDisplay } from "@/lib/types";
import { must } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Devoluciones") };
}

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  await requirePerm("ventas_editar");
  const filters = filtersFrom(await searchParams);
  const supabase = await createClient();
  let q = supabase.from("v_returns").select("*");
  if (filters.from) q = q.gte("return_date", filters.from);
  if (filters.to) q = q.lte("return_date", filters.to);
  const data = must(await q.order("return_date", { ascending: false }).limit(500), t("las devoluciones"));
  const rows = data ?? [];
  const refunded = rows.reduce((a, r) => a + Number(r.refund_amount), 0);
  const lost = rows.reduce((a, r) => a + Number(r.lost_cost), 0);
  return (
    <>
      <PageHeader
        title={t("Devoluciones")}
        description={t("Productos devueltos y reembolsos de Vinted/Wallapop. Para registrar una, abre la venta y pulsa «Registrar devolución».")}
        actions={<LinkButton href="/devoluciones/nueva" variant="primary">{t("Nueva devolución")}</LinkButton>}
      />
      <FilterBar
        basePath="/devoluciones"
        values={filters}
        fields={[
          { type: "date", name: "from", label: t("Desde") },
          { type: "date", name: "to", label: t("Hasta") },
        ]}
      />
      <Figures
        className="mb-4"
        items={[
          { label: t("Unidades devueltas"), value: units(rows.reduce((a, r) => a + r.quantity, 0)) },
          { label: t("Importe reembolsado"), value: money(refunded) },
          { label: t("Pérdida (sin producto)"), value: money(lost), tone: lost > 0 ? "bad" : "default" },
        ]}
      />
      <Panel padded={false}>
        {rows.length === 0 ? (
          <Empty title={t("No hay devoluciones")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("Fecha")}</Th>
                <Th>{t("Venta")}</Th>
                <Th>{t("Producto")}</Th>
                <Th>{t("Tipo")}</Th>
                <Th>{t("Plataforma")}</Th>
                <Th num>{t("Uds.")}</Th>
                <Th num>{t("Reembolso")}</Th>
                <Th num>{t("Pérdida")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.return_item_id}>
                  <Td className="num">{date(r.return_date)}</Td>
                  <Td>
                    <Link href={`/ventas/${r.sale_id}`} className="mono whitespace-nowrap text-[12.5px] font-medium text-brand-ink hover:underline">
                      {r.sale_number}
                    </Link>
                  </Td>
                  <Td>
                    {variantDisplay(r.product_name, r.variant_name)}
                    {r.reason && <span className="block text-xs text-muted">{r.reason}</span>}
                  </Td>
                  <Td>{r.restocked ? <Badge tone="good">{t("Vuelve al stock")}</Badge> : <Badge tone="bad">{t("Sin producto")}</Badge>}</Td>
                  <Td>{r.platform_name}</Td>
                  <Td num>{r.quantity}</Td>
                  <Td num>{money(r.refund_amount)}</Td>
                  <Td num>{money(r.lost_cost)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
