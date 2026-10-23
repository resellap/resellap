import { tSync } from "@/i18n/server";
import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import { date, daysUntil } from "@/lib/format";
import { Notice } from "./ui";

/** Aviso del estado de la prueba o la suscripción. Nunca se oculta un problema de acceso. */
export function SubscriptionBanner({ user }: { user: CurrentUser }) {
  const t = tSync();
  const s = user.subscription;
  if (!s || s.comped) return null;
  const admin = user.role === "admin";
  const go = admin ? (
    <Link href="/suscripcion" className="font-semibold">
      {t("Ir a Suscripción")}
    </Link>
  ) : (
    <>{t("Avisa al administrador de tu espacio.")}</>
  );
  if (user.orgStatus === "eliminacion_solicitada") {
    const purge = user.deletionRequestedAt ? new Date(new Date(user.deletionRequestedAt).getTime() + 30 * 86400000).toISOString() : null;
    return (
      <Notice tone="bad" className="mb-4" title={t("Eliminación del espacio solicitada")}>
        {t("Puedes consultar y exportar tus datos, pero no registrar cambios.")}{" "}
        {purge ? t("Se borrarán definitivamente a partir del {purge}.", { purge: date(purge) }) : ""}{" "}
        {admin && (
          <Link href="/suscripcion" className="font-semibold">
            {t("Anular la eliminación")}
          </Link>
        )}
      </Notice>
    );
  }
  if (!user.hasAccess) {
    const trialOver = s.status === "trialing";
    return (
      <Notice tone="bad" className="mb-4" title={trialOver ? t("Tu prueba gratuita ha terminado") : t("La suscripción no está activa")}>
        {trialOver
          ? t("Tus datos están a salvo y puedes consultarlos y exportarlos, pero no registrar cambios hasta suscribirte.")
          : t("Tus datos están a salvo y puedes consultarlos y exportarlos, pero no registrar cambios hasta reactivar la suscripción.")}{" "}
        {go}
      </Notice>
    );
  }
  if (s.status === "trialing" && s.trialEndsAt) {
    const days = daysUntil(s.trialEndsAt);
    return (
      <Notice tone="info" className="mb-4">
        {days === 1
          ? t("Prueba gratuita: queda 1 día (hasta el {end}).", { end: date(s.trialEndsAt) })
          : t("Prueba gratuita: quedan {days} días (hasta el {end}).", { days, end: date(s.trialEndsAt) })}{" "}
        {t("Después, 4,99 € al mes si te suscribes; si no, el espacio queda en solo lectura.")} {admin && go}
      </Notice>
    );
  }
  if (s.status === "past_due") {
    return (
      <Notice tone="warn" className="mb-4" title={t("No se ha podido cobrar el último pago")}>
        {t("Se volverá a intentar en los próximos días. Revisa tu método de pago para no perder el acceso.")} {go}
      </Notice>
    );
  }
  if (s.cancelAtPeriodEnd && s.currentPeriodEnd) {
    return (
      <Notice tone="warn" className="mb-4">
        {t("La suscripción está cancelada y termina el {end}. Hasta entonces todo funciona con normalidad.", { end: date(s.currentPeriodEnd) })} {go}
      </Notice>
    );
  }
  return null;
}
