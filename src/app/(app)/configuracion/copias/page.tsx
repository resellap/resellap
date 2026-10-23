import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Notice, PageHeader, Panel, buttonClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { BackupChecker } from "./backup-checker";
import { DownloadBackup } from "./download-backup";

export const metadata: Metadata = { title: msg("Copias de seguridad") };

export default async function BackupSettings() {
  const t = await getT();
  await requireAdmin();
  return (
    <>
      <PageHeader title={t("Copias de seguridad")} back={{ href: "/configuracion", label: t("Ajustes") }} description={t("Copias manuales de todos los datos del negocio, para guardarlas donde tú quieras (iCloud, Google Drive, el ordenador…).")} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("Crear una copia")}>
          <ul className="mb-4 flex list-disc flex-col gap-1.5 pl-5 text-sm text-ink-soft">
            <li>{t("Incluye todo: productos, compras, lotes, movimientos, ventas, devoluciones, salidas, anuncios, responsables, listas, correos de ventas y auditoría.")}</li>
            <li>{t("No incluye los archivos de fotos y etiquetas (siguen en el almacén de Supabase) ni la conexión de Gmail.")}</li>
            <li>{t("Si alguna tabla no se puede leer completa, no se descarga nada y verás el error (nunca una copia a medias).")}</li>
          </ul>
          <DownloadBackup />
        </Panel>
        <Panel title={t("Comprobar una copia")} description={t("Elige un archivo de copia para ver qué contiene y compararlo con los datos actuales. No cambia nada.")}>
          <BackupChecker />
        </Panel>
        <Panel title={t("Restaurar")} className="lg:col-span-2">
          <Notice tone="warn" title={t("Restaurar desde la app no está disponible")}>
            {t("Volver a cargar una copia encima de los datos actuales podría duplicar ventas o descuadrar el stock de los lotes, y la app todavía no tiene un procedimiento probado que lo evite. La copia guarda todos los datos necesarios: si algún día hace falta recuperarlos, se puede hacer con ayuda técnica directamente en Supabase. Para cargar datos de un Excel usa")}{" "}
            <a href="/importar" className="font-semibold underline">
              {t("Importar Excel")}
            </a>
            {t(", que avisa antes de duplicar.")}
          </Notice>
          <p className="mt-3 text-[13px] text-muted">
            {t("Recomendación: descarga una copia cada semana o antes de cambios grandes (importaciones, borrados) y guárdala fuera del móvil.")}
          </p>
          <a href="/configuracion/actividad" className={buttonClass("ghost", "sm", "mt-2")}>
            <Download size={15} />{" "}{t("Ver copias descargadas en el historial")}
          </a>
        </Panel>
      </div>
    </>
  );
}
