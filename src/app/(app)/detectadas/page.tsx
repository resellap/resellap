import { getT, tSync } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { CarrierIcon, PlatformIcon } from "@/components/marks";
import { ProductThumb } from "@/components/thumb";
import { Badge, Empty, Notice, PageHeader, clsx } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_LABEL } from "@/lib/email/parse";
import { loadDetected, type DetectedSale, type Option } from "./data";
import { ConfidenceBadge, ConfirmAllButton, DetectedActions } from "./detected-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Ventas detectadas") };
}
export const maxDuration = 60;

const PLATFORM_NAME = PLATFORM_LABEL;

export default async function DetectedPage() {
  const t = await getT();
  await requirePerm("correo");
  const [{ rows, error, carriers, responsibles }, supabase] = await Promise.all([loadDetected(), createClient()]);
  const { data: st } = await supabase.rpc("email_integration_status");
  const status = (st ?? {}) as { connected?: boolean; last_success_at?: string | null; email?: string | null };

  // Se pueden confirmar de golpe las que no tienen ninguna duda
  const clean = rows.filter((r) => r.suggestion && r.suggestion.stock > 0 && !r.doubt && !r.likelyDuplicate && r.price && (r.responsibleId || responsibles.length === 1));
  const ready = rows.filter((r) => r.suggestion && !r.doubt && !r.likelyDuplicate).length;

  return (
    <>
      <PageHeader
        title={t("Ventas detectadas")}
        description={t("Resellap lee los correos de Vinted, Wallapop, eBay, Milanuncios y Facebook Marketplace, identifica el producto, el transportista y el comprador, y te lo deja preparado. Tú solo revisas y confirmas: hasta entonces no se registra nada ni se toca el stock.")}
        actions={
          clean.length >= 2 ? (
            <ConfirmAllButton
              items={clean.map((r) => ({ emailId: r.id, variantId: r.suggestion!.id, carrierId: r.carrier?.id ?? null, responsibleId: r.responsibleId ?? (responsibles.length === 1 ? responsibles[0].id : null) }))}
            />
          ) : undefined
        }
      />
      {error && <Notice tone="bad">{error}</Notice>}

      {/* Estado de la automatización */}
      <section className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rs-card rounded-[var(--radius-md)] bg-surface px-4 py-3 text-[13.5px]">
        <span className="flex items-center gap-2 font-medium">
          <span aria-hidden className={clsx("h-2 w-2 rounded-full", status.connected ? "bg-brand-mark" : "bg-line-strong")} />
          {status.connected ? t("Correo conectado") : t("Correo sin conectar")}
        </span>
        {status.connected && status.last_success_at && <span className="text-faint">{t("Última revisión:")}{" "}{dateTime(status.last_success_at)}</span>}
        <span className="text-faint">
          {rows.length === 0 ? t("Nada por revisar") : t("{length} por revisar · {ready} listas para confirmar", { length: rows.length, ready })}
        </span>
        <Link href="/correos" className="ml-auto inline-flex min-h-10 items-center gap-1.5 font-semibold text-brand-ink hover:underline">
          <Mail size={16} strokeWidth={1.75} />
          {status.connected ? t("Ventas por correo") : t("Conectar Gmail")}
        </Link>
      </section>

      {!error && rows.length === 0 ? (
        <div className="rs-card rounded-[var(--radius-md)] bg-surface">
          <Empty title={t("Nada por confirmar")}>{t("Cuando llegue una venta de Vinted, Wallapop, eBay, Milanuncios o Facebook Marketplace a tu correo, aparecerá aquí con el producto, el transportista y la foto ya identificados.")}</Empty>
        </div>
      ) : (
        <ul className="stagger grid gap-4 2xl:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id}>
              <DetectedCard sale={r} carriers={carriers} responsibles={responsibles} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DetectedCard({ sale: r, carriers, responsibles }: { sale: DetectedSale; carriers: Option[]; responsibles: Option[] }) {
  const t = tSync();
  const resp = responsibles.find((x) => x.id === r.responsibleId)?.name ?? null;
  return (
    <article className="flex h-full flex-col overflow-hidden rs-card rounded-[var(--radius-md)] bg-surface">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 text-[13px]">
        <PlatformIcon name={PLATFORM_NAME[r.platform]} size={20} className="font-medium" />
        <Badge tone="good" dot>
          {t("Nueva venta detectada")}
        </Badge>
        {r.likelyDuplicate && <Badge tone="warn">{t("¿Ya apuntada?")}</Badge>}
        <span className="num ml-auto text-faint">{dateTime(r.receivedAt)}</span>
      </header>

      <div className="flex gap-3.5 px-4 pt-4 sm:gap-4">
        <ProductThumb src={r.image} alt={r.product} size={88} rounded={14} className="max-sm:h-[72px] max-sm:w-[72px]" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[16px] font-semibold leading-snug text-ink">{r.product || t("Artículo sin nombre")}</p>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-muted">
            {r.buyer && <span>{t("Comprador:")}{" "}{r.buyer}</span>}
            <span className="num">{r.saleDate.split("-").reverse().join("/")}</span>
            {r.reference && <span className="num">{t("Ref.")}{" "}{r.reference}</span>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="num text-[22px] font-semibold leading-none tracking-[-0.02em] text-ink sm:text-[24px]">{r.price !== null ? money(r.price) : "—"}</p>
          {(r.shipping !== null || r.total !== null) && (
            <p className="num mt-1 text-[12px] text-faint">
              {r.shipping !== null && <span className="block sm:inline">{t("envío")}{" "}{money(r.shipping)}</span>}
              {r.total !== null && (
                <span className="block sm:inline">
                  <span className="max-sm:hidden">{r.shipping !== null && " · "}</span>{t("total {total}", { total: money(r.total) })}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Lo que Resellap ha detectado */}
      <div className="mx-4 mt-4 overflow-hidden rounded-[14px] border border-line">
        <p className="flex items-center gap-1.5 border-b border-line px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-faint">
          <Sparkles size={13} strokeWidth={2} className="text-brand" />{" "}{t("Resellap ha detectado")}
        </p>
        <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
          <div className="bg-surface px-3 py-2.5 sm:col-span-2">
            <dt className="text-[12px] text-faint">{t("Producto")}</dt>
            <dd className="mt-1 flex items-center gap-2.5">
              {r.suggestion ? (
                <>
                  <ProductThumb src={r.suggestion.photo} alt="" size={32} rounded={8} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink">{r.suggestion.label}</span>
                    <span className={clsx("text-[12px]", r.suggestion.stock > 0 ? "text-faint" : "font-semibold text-danger")}>
                      {r.suggestion.stock > 0 ? t("{stock} en stock", { stock: r.suggestion.stock }) : t("Sin stock")}
                    </span>
                  </span>
                  <ConfidenceBadge score={r.suggestion.score} />
                </>
              ) : (
                <span className="text-[14px] font-medium text-warn">
                  {r.alternatives.length ? (r.alternatives.length === 1 ? t("Sin elegir: 1 posible") : t("Sin elegir: {length} posibles", { length: r.alternatives.length })) : t("Sin identificar")}
                </span>
              )}
            </dd>
          </div>
          <div className="bg-surface px-3 py-2.5">
            <dt className="text-[12px] text-faint">{t("Transportista")}</dt>
            <dd className="mt-1 text-[14px] font-medium">
              {r.carrier ? <CarrierIcon name={r.carrier.name} size={20} /> : <span className="text-faint">{t("Sin detectar · lo eliges al confirmar")}</span>}
            </dd>
          </div>
          <div className="bg-surface px-3 py-2.5">
            <dt className="text-[12px] text-faint">{t("Responsable")}</dt>
            <dd className="mt-1 truncate text-[14px] font-medium">{resp ?? <span className="text-faint">{t("Sin asignar · lo eliges al confirmar")}</span>}</dd>
          </div>
          {r.tracking && (
            <div className="bg-surface px-3 py-2.5 sm:col-span-2">
              <dt className="text-[12px] text-faint">{t("Código de seguimiento (de la etiqueta)")}</dt>
              <dd className="num mt-1 text-[14px] font-medium">{r.tracking}</dd>
            </div>
          )}
        </dl>
      </div>

      {r.note && (
        <Notice tone={r.doubt || !r.suggestion ? "warn" : "neutral"} className="mx-4 mt-3">
          {r.note}
        </Notice>
      )}
      {r.likelyDuplicate && r.existing[0] && (
        <Notice tone="warn" className="mx-4 mt-3" title={t("Puede que ya la tengas apuntada")}>
          {t("Se parece a la venta {number} ({reasons}). Si es la misma, pulsa «Ya estaba apuntada».", { number: r.existing[0].number, reasons: r.existing[0].reasons.map((x) => t(x)).join(", ").toLowerCase() })}
        </Notice>
      )}

      <div className="mt-auto px-4 pb-4 pt-4">
        <DetectedActions sale={r} carriers={carriers} responsibles={responsibles} />
      </div>
    </article>
  );
}
