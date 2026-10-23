import { getT, tSync } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { RecoverForm } from "./recover-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Recuperar contraseña") };
}

export default function RecoverPage() {
  const t = tSync();
  return (
    <AuthLayout title={t("Recuperar contraseña")} subtitle={t("Te enviaremos un enlace para elegir una nueva.")}>
      <RecoverForm />
      <p className="mt-6 text-sm">
        <Link href="/login" className="font-semibold text-brand-ink underline-offset-2 hover:underline">
          {t("Volver a entrar")}
        </Link>
      </p>
    </AuthLayout>
  );
}
