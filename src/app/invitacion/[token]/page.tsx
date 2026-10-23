import { getT } from "@/i18n/server";
import { rich } from "@/i18n/rich";
import { msg } from "@/i18n/translate";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { buttonClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvitation } from "./accept";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Invitación") };
}

const ROLE = { admin: msg("Únete a <b>{org}</b> como administrador."), vendedor: msg("Únete a <b>{org}</b> como vendedor."), almacen: msg("Únete a <b>{org}</b> como almacén.") } as const;

export default async function InvitationPage({ params }: PageProps<"/invitacion/[token]">) {
  const t = await getT();
  const { token } = await params;
  const valid = /^[0-9a-f]{64}$/.test(token);
  const supabase = await createClient();
  const info = valid ? ((await supabase.rpc("invitation_info", { p_token: token })).data as { organization: string; email: string; role: keyof typeof ROLE; state: string } | null) : null;
  const user = await getCurrentUser();
  const here = `/invitacion/${token}`;

  if (!info || info.state !== "valida") {
    return (
      <AuthLayout title={t("Invitación no válida")} subtitle={t("El enlace no existe, ya se usó, se ha revocado o ha caducado. Pide a quien te invitó que te envíe una nueva.")}>
        <Link href="/" className={buttonClass("secondary", "md")}>
          {t("Ir al inicio")}
        </Link>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title={t("Te han invitado")} subtitle={rich(t(ROLE[info.role], { org: info.organization }), { b: (c) => <strong>{c}</strong> })}>
      {!user ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">{rich(t("La invitación es para <b>{email}</b>.", { email: info.email }), { b: (c) => <strong>{c}</strong> })}</p>
          <Link href={`/registro?next=${encodeURIComponent(here)}`} className={buttonClass("primary", "md")}>
            {t("Crear cuenta")}
          </Link>
          <Link href={`/login?next=${encodeURIComponent(here)}`} className={buttonClass("secondary", "md")}>
            {t("Ya tengo cuenta: entrar")}
          </Link>
        </div>
      ) : user.email.toLowerCase() !== info.email ? (
        <div className="flex flex-col gap-3 text-sm">
          <p>
            {rich(t("Has entrado como <b>{me}</b>, pero la invitación es para <b>{email}</b>.", { me: user.email, email: info.email }), { b: (c) => <strong>{c}</strong> })}
          </p>
          <form action="/auth/salir" method="post">
            <button className={buttonClass("secondary", "md")}>{t("Cerrar sesión y entrar con el otro email")}</button>
          </form>
        </div>
      ) : (
        <AcceptInvitation token={token} />
      )}
    </AuthLayout>
  );
}
