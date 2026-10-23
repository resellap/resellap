import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { loadPrefs } from "@/lib/user-prefs";
import { AppearanceEditor } from "./appearance-editor";

export const metadata: Metadata = { title: msg("Personalizar aspecto") };

export default async function AppearanceSettings() {
  const t = await getT();
  await requireUser();
  const prefs = await loadPrefs();
  return (
    <>
      <PageHeader title={t("Personalizar aspecto")} back={{ href: "/configuracion", label: t("Ajustes") }} description={t("Los cambios se ven al momento; pulsa «Guardar cambios» para conservarlos en todos tus dispositivos.")} />
      <AppearanceEditor initial={prefs.appearance} />
    </>
  );
}
