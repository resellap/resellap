import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { buttonClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvitation } from "./accept";

export const metadata: Metadata = { title: msg("Invitación") };

const ROLE = { admin: "administrador", vendedor: "vendedor", almacen: "almacén" } as const;

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
    <AuthLayout title={t("Te han invitado")} subtitle={<>{t("Únete a")}{" "}<strong>{info.organization}</strong>{" "}{t("como {ROLE}.", { ROLE: ROLE[info.role] })}</>}>
      {!user ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">{t("La invitación es para")}{" "}<strong>{info.email}</strong>.</p>
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
            {t("Has entrado como")}{" "}<strong>{user.email}</strong>{t(", pero la invitación es para")}{" "}<strong>{info.email}</strong>.
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
