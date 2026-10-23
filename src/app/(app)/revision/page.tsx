import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Empty, PageHeader, Panel, Tabs } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { first, type SearchParams } from "@/lib/filters";
import { dateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ReviewActions } from "./review-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Pendientes de revisar") };
}

const KINDS: Record<string, { label: string; tone: "warn" | "bad" | "info" | "neutral" }> = {
  proveedor_pendiente: { label: msg("Proveedor pendiente"), tone: "warn" },
  motivo_pendiente: { label: msg("Motivo pendiente"), tone: "warn" },
  venta_sin_lote: { label: msg("Lote no identificado"), tone: "bad" },
  venta_no_importada: { label: msg("Venta no importada"), tone: "bad" },
  salida_no_importada: { label: msg("Salida no importada"), tone: "bad" },
  fila_con_errores: { label: msg("Fila con errores"), tone: "bad" },
  posible_duplicado: { label: msg("Posible duplicado"), tone: "info" },
};

export default async function ReviewPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  await requirePerm("importar");
  const sp = await searchParams;
  const status = (first(sp.estado) ?? "pendiente") as "pendiente" | "resuelto" | "descartado";
  const supabase = await createClient();
  const [{ data }, { data: pos }] = await Promise.all([
    supabase.from("review_items").select("*").eq("status", status).order("created_at").limit(500),
    supabase.from("purchase_orders").select("id, order_number"),
  ]);
  const poByNumber = new Map((pos ?? []).map((p) => [p.order_number as number, p.id as string]));

  function link(kind: string, payload: Record<string, unknown> | null) {
    if (kind === "proveedor_pendiente" && payload?.order_number && poByNumber.get(Number(payload.order_number)))
      return { href: `/compras/${poByNumber.get(Number(payload.order_number))}`, label: t("Abrir el pedido") };
    if (kind === "motivo_pendiente") return { href: "/salidas", label: t("Ir a salidas sin venta") };
    if (kind === "venta_sin_lote" || kind === "venta_no_importada") return { href: "/ventas/nueva", label: t("Registrar la venta a mano") };
    return null;
  }

  return (
    <>
      <PageHeader title={t("Pendientes de revisar")} description={t("Datos que no se pudieron determinar automáticamente. No se ha inventado nada: complétalos aquí.")} />
      <Tabs
        current={status}
        items={[
          { key: "pendiente", label: t("Pendientes"), href: "/revision" },
          { key: "resuelto", label: t("Resueltos"), href: "/revision?estado=resuelto" },
          { key: "descartado", label: t("Descartados"), href: "/revision?estado=descartado" },
        ]}
      />
      <Panel padded={false}>
        {(data ?? []).length === 0 ? (
          <Empty title={status === "pendiente" ? t("No hay nada pendiente") : t("Nada por aquí")} />
        ) : (
          <ul className="divide-y divide-line">
            {(data ?? []).map((r) => {
              const k = KINDS[r.kind] ?? { label: r.kind, tone: "neutral" as const };
              const l = link(r.kind, r.payload);
              return (
                <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <Badge tone={k.tone}>{t(k.label)}</Badge>
                      <span className="font-semibold">{r.title}</span>
                    </p>
                    {r.details && <p className="mt-1 text-sm text-ink-soft">{r.details}</p>}
                    {r.payload && r.kind !== "proveedor_pendiente" && (
                      <details className="mt-1 text-[13px] text-muted">
                        <summary className="cursor-pointer">{t("Datos originales")}</summary>
                        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3">
                          {Object.entries(r.payload as Record<string, unknown>)
                            .filter(([, v]) => v !== null && typeof v !== "object")
                            .map(([key, v]) => (
                              <div key={key} className="contents">
                                <dt>{key}</dt>
                                <dd className="text-ink-soft">{String(v)}</dd>
                              </div>
                            ))}
                        </dl>
                      </details>
                    )}
                    {r.resolution_note && <p className="mt-1 text-[13px] text-muted">{t("Nota:")}{" "}{r.resolution_note}</p>}
                    <p className="mt-1 text-xs text-faint">{dateTime(r.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {l && (
                      <Link href={l.href} className="text-[13px] font-semibold text-brand-ink hover:underline">
                        {l.label}
                      </Link>
                    )}
                    <ReviewActions id={r.id} status={r.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
