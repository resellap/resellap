import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requirePerm } from "@/lib/auth";
import { loadPrefs } from "@/lib/user-prefs";
import { TablesEditor } from "./tables-editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Tablas") };
}

export default async function TablesSettings() {
  const t = await getT();
  await requirePerm("costes");
  const prefs = await loadPrefs();
  return (
    <>
      <PageHeader
        title={t("Tablas")}
        back={{ href: "/configuracion", label: t("Ajustes") }}
        description={t("Columnas, orden y filas por página de las tablas de Ventas y Productos (en el ordenador). Ocultar una columna no borra ningún dato.")}
      />
      <TablesEditor initial={prefs.tables} />
    </>
  );
}
