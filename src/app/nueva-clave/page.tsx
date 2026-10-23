import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { requireSession } from "@/lib/auth";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: msg("Nueva contraseña") };

export default async function NewPasswordPage() {
  const t = await getT();
  const user = await requireSession();
  return (
    <AuthLayout title={t("Nueva contraseña")} subtitle={t("Para {email}.", { email: user.email })}>
      <NewPasswordForm />
    </AuthLayout>
  );
}
