import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { loadPrefs } from "@/lib/user-prefs";
import { NotificationsEditor } from "./notifications-editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Avisos") };
}

export default async function NotificationSettings() {
  const t = await getT();
  const user = await requireUser();
  const prefs = await loadPrefs();
  return (
    <>
      <PageHeader
        title={t("Avisos")}
        back={{ href: "/configuracion", label: t("Ajustes") }}
        description={t("Los avisos aparecen dentro de la app: en «Tareas» del inicio y como números en el menú. No se envían correos ni notificaciones fuera de la app.")}
      />
      <NotificationsEditor initial={prefs.notifications} admin={user.role === "admin"} />
    </>
  );
}
