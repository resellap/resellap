import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { loadSaleOptions } from "@/lib/options";
import { loadPrefs } from "@/lib/user-prefs";
import { SalesPrefsEditor } from "./sales-prefs-editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Ventas e inventario") };
}

export default async function SalesSettings() {
  const t = await getT();
  const user = await requireUser();
  const [prefs, opts] = await Promise.all([loadPrefs(), loadSaleOptions()]);
  return (
    <>
      <PageHeader title={t("Ventas e inventario")} back={{ href: "/configuracion", label: t("Ajustes") }} description={t("Valores que se rellenan solos para ir más rápido. Siempre los puedes cambiar en cada venta.")} />
      <SalesPrefsEditor initial={prefs.sales} platforms={opts.platforms.map((p) => ({ id: p.id, name: p.name }))} admin={user.role === "admin"} />
    </>
  );
}
