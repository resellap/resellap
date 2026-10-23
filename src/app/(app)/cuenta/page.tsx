import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mi cuenta") };
}

export default async function AccountPage() {
  const t = await getT();
  const user = await requireUser();
  return (
    <>
      <PageHeader title={t("Mi cuenta")} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("Datos")}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">{t("Email")}</dt>
            <dd>{user.email}</dd>
            <dt className="text-muted">{t("Nombre")}</dt>
            <dd>{user.fullName ?? "—"}</dd>
            <dt className="text-muted">{t("Rol")}</dt>
            <dd>{user.role === "admin" ? t("Administrador") : user.role === "almacen" ? t("Almacén") : t("Vendedor")}</dd>
            <dt className="text-muted">{t("Responsable")}</dt>
            <dd>{user.responsibleName ?? t("Sin vincular")}</dd>
          </dl>
        </Panel>
        <Panel title={t("Cambiar contraseña")}>
          <PasswordForm />
        </Panel>
      </div>
    </>
  );
}
