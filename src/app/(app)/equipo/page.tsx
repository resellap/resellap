import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { Badge, Notice, PageHeader, Panel, Table, Td, Th, Tr } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { mailConfigured } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";
import { InviteButton, MemberActions, RevokeButton } from "./team-forms";

export const metadata: Metadata = { title: msg("Equipo") };

const ROLE = { admin: "Administrador", vendedor: "Vendedor", almacen: "Almacén" } as const;
const ROLE_TONE = { admin: "info", vendedor: "neutral", almacen: "warn" } as const;
const STATE_TONE = { pendiente: "warn", aceptada: "good", revocada: "neutral", caducada: "neutral" } as const;

type Member = {
  user_id: string;
  email: string;
  full_name: string | null;
  role: keyof typeof ROLE;
  joined_at: string;
  is_me: boolean;
  permissions: string[];
  custom: boolean;
};
type Invitation = { id: string; email: string; role: keyof typeof ROLE; created_at: string; expires_at: string; state: keyof typeof STATE_TONE };

export default async function TeamPage() {
  const t = await getT();
  const me = await requireAdmin();
  const supabase = await createClient();
  const [members, invitations] = await Promise.all([supabase.rpc("org_members"), supabase.rpc("org_invitations")]);
  const list = (members.data ?? []) as Member[];
  const invites = (invitations.data ?? []) as Invitation[];
  const admins = list.filter((m) => m.role === "admin").length;
  return (
    <>
      <PageHeader
        title={t("Equipo")}
        description={t("Quién trabaja en {orgName} y con qué permisos. Los permisos los aplica la base de datos, no solo la pantalla.", { orgName: me.orgName })}
        actions={me.hasAccess ? <InviteButton mail={mailConfigured()} /> : undefined}
      />
      {(members.error || invitations.error) && (
        <Notice tone="bad" className="mb-4">
          {t("No se ha podido cargar el equipo. Vuelve a intentarlo.")}
        </Notice>
      )}
      <Panel padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>{t("Persona")}</Th>
              <Th>{t("Rol")}</Th>
              <Th>{t("Desde")}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <Tr key={m.user_id}>
                <Td>
                  <span className="font-semibold">{m.full_name || m.email}</span>
                  {m.is_me && <span className="ml-2 text-xs text-muted">{t("(tú)")}</span>}
                  {m.full_name && <span className="block text-xs text-muted">{m.email}</span>}
                </Td>
                <Td>
                  <Badge tone={ROLE_TONE[m.role]}>{ROLE[m.role]}</Badge>
                  {m.custom && <span className="ml-1.5 text-xs text-muted">{t("permisos a medida")}</span>}
                </Td>
                <Td>{dateTime(m.joined_at)}</Td>
                <Td className="text-right">
                  <MemberActions member={m} lastAdmin={m.role === "admin" && admins <= 1} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Panel>
      <div className="mt-4 grid gap-2 text-[13px] text-muted sm:grid-cols-3">
        <p><strong className="text-ink">{t("Administrador:")}</strong>{" "}{t("todo, incluidos costes, beneficios, equipo y suscripción.")}</p>
        <p><strong className="text-ink">{t("Vendedor:")}</strong>{" "}{t("registra y consulta sus ventas; no ve costes ni las ventas de otros. Ajustable con «Permisos».")}</p>
        <p><strong className="text-ink">{t("Almacén:")}</strong>{" "}{t("ve stock y envíos y marca los envíos; no ve costes ni crea ventas. Ajustable con «Permisos».")}</p>
      </div>

      {invites.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-lg font-semibold">{t("Invitaciones")}</h2>
          <Panel padded={false}>
            <Table>
              <thead>
                <tr>
                  <Th>{t("Email")}</Th>
                  <Th>{t("Rol")}</Th>
                  <Th>{t("Estado")}</Th>
                  <Th>{t("Caduca")}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <Tr key={i.id} muted={i.state !== "pendiente"}>
                    <Td>{i.email}</Td>
                    <Td>{ROLE[i.role]}</Td>
                    <Td>
                      <Badge tone={STATE_TONE[i.state]}>{i.state}</Badge>
                    </Td>
                    <Td>{dateTime(i.expires_at)}</Td>
                    <Td className="text-right">{i.state === "pendiente" && <RevokeButton id={i.id} email={i.email} />}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        </>
      )}
    </>
  );
}
