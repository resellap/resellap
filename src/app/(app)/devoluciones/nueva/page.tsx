import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Notice, PageHeader, Panel } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { todayIso } from "@/lib/format";
import { first, type SearchParams } from "@/lib/filters";
import { createClient } from "@/lib/supabase/server";
import { variantDisplay } from "@/lib/types";
import { ReturnForm } from "./return-form";
import { must } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Nueva devolución") };
}

export default async function NewReturn({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  await requirePerm("ventas_editar");
  const sp = await searchParams;
  const supabase = await createClient();
  let saleId = first(sp.venta);
  const number = first(sp.numero)?.trim();
  if (!saleId && number) {
    const { data } = await supabase.from("sales").select("id").eq("sale_number", number.toUpperCase()).eq("status", "activa").maybeSingle();
    saleId = data?.id;
  }
  if (!saleId) {
    return (
      <>
        <PageHeader title={t("Nueva devolución")} back={{ href: "/devoluciones", label: t("Devoluciones") }} />
        <Panel className="max-w-lg" title={t("¿De qué venta?")}>
          <form method="get" className="flex gap-2">
            <input name="numero" placeholder={t("Nº de venta, por ejemplo V-000072")} defaultValue={number} className="h-11 flex-1 rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3 text-base sm:h-10 sm:text-sm" />
            <button className="h-10 rounded-[var(--radius-sm)] bg-brand px-4 text-sm font-semibold text-on-brand">{t("Buscar")}</button>
          </form>
          {number && <Notice tone="warn" className="mt-3">{t("No hay ninguna venta activa con el número {number}.", { number })}</Notice>}
          <p className="mt-3 text-[13px] text-muted">{t("También puedes abrir la venta y pulsar «Registrar devolución».")}</p>
        </Panel>
      </>
    );
  }
  const [saleRes, linesRes] = await Promise.all([
    supabase.from("sales").select("id, sale_number, status, platforms(name)").eq("id", saleId).maybeSingle(),
    supabase.from("v_sale_lines").select("sale_item_id, product_name, variant_name, quantity, returned_qty, unit_price, refunded_amount").eq("sale_id", saleId).order("line_number"),
  ]);
  const sale = must(saleRes, "la venta");
  const lines = must(linesRes, "las líneas de la venta");
  if (!sale || sale.status !== "activa" || !lines?.length) {
    return (
      <>
        <PageHeader title={t("Nueva devolución")} back={{ href: "/devoluciones", label: t("Devoluciones") }} />
        <Notice tone="bad">{t("Esa venta no existe o está anulada.")}</Notice>
      </>
    );
  }
  const platform = (sale as unknown as { platforms: { name: string } | null }).platforms?.name;
  return (
    <>
      <PageHeader title={t("Devolución de la venta {sale_number}", { sale_number: sale.sale_number })} description={platform ? t("Vendida en {platform}.", { platform }) : undefined} back={{ href: `/ventas/${sale.id}`, label: t("Venta {sale_number}", { sale_number: sale.sale_number }) }} />
      <ReturnForm
        saleId={sale.id}
        saleNumber={sale.sale_number}
        today={todayIso()}
        lines={lines.map((l) => ({
          id: l.sale_item_id,
          label: variantDisplay(l.product_name, l.variant_name),
          quantity: l.quantity,
          already: l.returned_qty,
          unit_price: Number(l.unit_price),
          refunded: Number(l.refunded_amount),
        }))}
      />
    </>
  );
}
