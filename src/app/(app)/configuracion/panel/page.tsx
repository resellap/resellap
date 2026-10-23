import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { loadSaleOptions } from "@/lib/options";
import { loadPrefs } from "@/lib/user-prefs";
import { DashboardEditor } from "./dashboard-editor";

export const metadata: Metadata = { title: msg("Personalizar panel") };

export default async function DashboardSettings() {
  const t = await getT();
  await requirePerm("costes");
  const [prefs, opts] = await Promise.all([loadPrefs(), loadSaleOptions()]);
  return (
    <>
      <PageHeader
        title={t("Personalizar panel")}
        back={{ href: "/configuracion", label: t("Ajustes") }}
        description={t("Elige qué ves en el inicio, con qué tamaño y en qué orden. El panel solo se cambia desde aquí.")}
      />
      <DashboardEditor initial={prefs.dashboard} platforms={opts.platforms.map((p) => ({ id: p.id, name: p.name }))} />
    </>
  );
}
