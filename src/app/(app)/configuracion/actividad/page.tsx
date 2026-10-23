import { getT } from "@/i18n/server";
import { rich } from "@/i18n/rich";
import { msg } from "@/i18n/translate";
import type { Metadata } from "next";
import Link from "next/link";
import { Empty, PageHeader, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { must } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Historial de actividad") };
}

const LABEL: Record<string, string> = {
  exportar: msg("Exportación"),
  exportar_mis_datos: msg("Descarga de mis datos"),
  copia_seguridad: msg("Copia de seguridad"),
  comprobar_copia: msg("Comprobación de copia"),
  preferencias: msg("Ajustes"),
  restablecer_preferencias: msg("Ajustes restablecidos"),
  cerrar_sesiones: msg("Sesiones cerradas"),
  crear_venta: msg("Venta"),
};

export default async function ActivityPage() {
  const t = await getT();
  const user = await requireUser();
  const supabase = await createClient();
  const rows = (must(await supabase.rpc("my_activity", { p_limit: 100 }), "tu historial") ?? []) as { occurred_at: string; action: string; entity: string; summary: string }[];
  return (
    <>
      <PageHeader
        title={t("Historial de actividad")}
        back={{ href: "/configuracion", label: t("Ajustes") }}
        description={t("Tus últimas operaciones registradas: exportaciones, copias, cambios de ajustes y acciones sobre ventas e inventario. Solo aparece lo que se registró en su momento.")}
      />
      {user.role === "admin" && (
        <p className="mb-4 text-sm text-ink-soft">
          {rich(t("Para ver todos los cambios de todos los usuarios, usa <a>Auditoría</a>."), {
            a: (c) => (
              <Link href="/auditoria" className="font-semibold text-brand-ink underline">
                {c}
              </Link>
            ),
          })}
        </p>
      )}
      <Panel padded={false}>
        {rows.length === 0 ? (
          <Empty title={t("Aún no hay operaciones registradas")} />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r, i) => (
              <li key={i} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="num w-36 shrink-0 text-[13px] text-muted">{dateTime(r.occurred_at)}</span>
                <span className="w-44 shrink-0 text-[13px] font-semibold">{LABEL[r.action] ? t(LABEL[r.action]) : r.action.replace(/_/g, " ")}</span>
                <span className="min-w-0 flex-1 text-sm">{t(r.summary)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
