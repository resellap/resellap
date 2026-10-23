import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Badge, buttonClass, Notice, PageHeader, Panel } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { date } from "@/lib/format";
import { PRICE_LABEL, TRIAL_DAYS } from "@/lib/site";
import { stripeConfigured, stripeTestMode } from "@/lib/stripe";
import { CancelDeletion, RequestDeletion } from "./deletion";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Suscripción") };
}

const STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "info" | "neutral" }> = {
  trialing: { label: msg("Prueba gratuita"), tone: "info" },
  active: { label: msg("Activa"), tone: "good" },
  past_due: { label: msg("Pago pendiente"), tone: "warn" },
  unpaid: { label: msg("Impagada"), tone: "bad" },
  canceled: { label: msg("Cancelada"), tone: "bad" },
  incomplete: { label: msg("Pago sin completar"), tone: "warn" },
  incomplete_expired: { label: msg("Pago caducado"), tone: "bad" },
  paused: { label: msg("En pausa"), tone: "warn" },
};

const ERRORS: Record<string, string> = {
  permiso: "Solo un administrador puede gestionar el pago.",
  "no-configurado": "Los pagos aún no están configurados en este servidor.",
  estado: "El espacio no está activo; no se puede contratar ahora.",
  "ya-suscrito": "Ya tienes una suscripción. Gestiónala desde «Gestionar pago».",
  "sin-cliente": "Aún no hay ningún pago asociado a este espacio.",
  stripe: "No se ha podido conectar con Stripe. Inténtalo de nuevo en unos minutos.",
};

export default async function SubscriptionPage({ searchParams }: PageProps<"/suscripcion">) {
  const t = await getT();
  const me = await requireAdmin();
  const sp = await searchParams;
  const s = me.subscription;
  const configured = stripeConfigured();
  const st = STATUS[s?.status ?? ""] ?? { label: s?.status ?? t("Sin datos"), tone: "neutral" as const };
  const hasStripeSub = !!s?.hasCustomer && !!s && ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"].includes(s.status ?? "") && s.currentPeriodEnd !== null;
  const deleting = me.orgStatus === "eliminacion_solicitada";
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;
  const detail = typeof sp.detalle === "string" ? sp.detalle.slice(0, 300) : null;
  return (
    <>
      <PageHeader title={t("Suscripción")} description={t("Plan único: {PRICE_LABEL} al mes. {TRIAL_DAYS} días de prueba gratis al crear el espacio.", { PRICE_LABEL, TRIAL_DAYS })} />
      {sp.ok === "pago" && (
        <Notice tone="good" className="mb-4" title={t("Pago recibido")}>
          {t("En cuanto Stripe lo confirme (suele tardar unos segundos), verás aquí la suscripción activa. Recarga la página si no aparece.")}
        </Notice>
      )}
      {error && (
        <Notice tone="bad" className="mb-4">
          {error}
          {detail && <span className="mt-1 block text-xs">{t("Motivo de Stripe:")}{" "}{detail}</span>}
        </Notice>
      )}
      {configured && stripeTestMode() && (
        <Notice tone="warn" className="mb-4" title={t("Modo de prueba")}>
          {t("Stripe está con claves de prueba: no se cobra dinero real.")}
        </Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="text-lg font-semibold">{t("Estado")}</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">{t("Espacio")}</dt>
            <dd className="font-semibold">{me.orgName}</dd>
            <dt className="text-muted">{t("Suscripción")}</dt>
            <dd>{s?.comped ? <Badge tone="good">{t("Acceso gratuito")}</Badge> : <Badge tone={st.tone}>{st.label}</Badge>}</dd>
            {s?.status === "trialing" && s.trialEndsAt && (
              <>
                <dt className="text-muted">{t("Prueba hasta")}</dt>
                <dd>{date(s.trialEndsAt)}</dd>
              </>
            )}
            {s?.currentPeriodEnd && (
              <>
                <dt className="text-muted">{s.cancelAtPeriodEnd ? t("Termina el") : t("Próxima renovación")}</dt>
                <dd>{date(s.currentPeriodEnd)}</dd>
              </>
            )}
            <dt className="text-muted">{t("Acceso")}</dt>
            <dd>{me.hasAccess ? t("Completo") : t("Solo lectura y exportación")}</dd>
          </dl>
          {!s?.comped && (
            <div className="mt-5 flex flex-wrap gap-2">
              {!configured ? (
                <Notice tone="info" className="w-full" title={t("Pagos pendientes de configuración")}>
                  {t("Aún no se puede contratar desde aquí. Tus datos no se pierden mientras tanto.")}
                </Notice>
              ) : (
                <>
                  {!hasStripeSub && !deleting && (
                    <form action="/api/stripe/checkout" method="post">
                      <button className={buttonClass("primary", "md")}>{t("Suscribirme por {PRICE_LABEL}/mes", { PRICE_LABEL })}</button>
                    </form>
                  )}
                  {s?.hasCustomer && (
                    <form action="/api/stripe/portal" method="post">
                      <button className={buttonClass("secondary", "md")}>{t("Gestionar pago, facturas o cancelar")}</button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
          <p className="mt-4 text-[13px] text-muted">
            {t("Cancelar no borra tus datos: el espacio pasa a solo lectura y puedes exportarlo cuando quieras.")}
          </p>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold">{t("Tus datos")}</h2>
          <p className="mt-2 text-sm text-ink-soft">{t("Descarga una copia completa de los datos de este espacio. Funciona también en solo lectura.")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/api/copia-seguridad" className={buttonClass("secondary", "md")}>
              {t("Descargar copia (JSON)")}
            </a>
          </div>
          <h3 className="mt-6 font-semibold">{t("Eliminar el espacio")}</h3>
          {deleting ? (
            <>
              <p className="mt-2 text-sm text-ink-soft">
                {t("Eliminación solicitada el {deletionRequestedAt}. Se borrará definitivamente a partir del", { deletionRequestedAt: date(me.deletionRequestedAt!) })}{" "}
                {date(new Date(new Date(me.deletionRequestedAt!).getTime() + 30 * 86400000).toISOString())}.
              </p>
              <div className="mt-3">
                <CancelDeletion />
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink-soft">{t("Borra el espacio, su equipo y todos sus datos. Hay 30 días para arrepentirse.")}</p>
              <div className="mt-3">
                <RequestDeletion orgName={me.orgName} />
              </div>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
