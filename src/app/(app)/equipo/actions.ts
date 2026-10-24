"use server";
import { msg } from "@/i18n/translate";
import { getT } from "@/i18n/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

type Role = "admin" | "vendedor" | "almacen";
const ROLE_TEXT: Record<Role, string> = { admin: msg("administrador"), vendedor: msg("vendedor"), almacen: msg("almacén") };

function done(message: string): ActionResult {
  revalidatePath("/equipo");
  revalidatePath("/responsables");
  return { ok: true, message };
}

/** Invita por email. Devuelve el enlace para copiarlo (y lo envía si hay correo configurado). */
export async function inviteMemberAction(email: string, role: Role): Promise<ActionResult<{ link: string; emailed: boolean }>> {
  const t = await getT();
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_member", { p_email: email, p_role: role });
  if (error || !data) return { ok: false, error: friendlyError(error) };
  const link = `${await siteUrl()}/invitacion/${data as string}`;
  const { sendTemplate } = await import("@/lib/mailer/send");
  const { invitation } = await import("@/lib/mailer/templates");
  const emailed = await sendTemplate(email.trim().toLowerCase(), t.locale, invitation, {
    who: me.fullName ?? me.email,
    org: me.orgName ?? "",
    role: t(ROLE_TEXT[role]),
    link,
  });
  revalidatePath("/equipo");
  return {
    ok: true,
    data: { link, emailed },
    message: emailed ? t("Invitación enviada por email.") : t("Invitación creada. Copia el enlace y envíaselo."),
  };
}

export async function revokeInvitationAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invitation", { p_id: id });
  if (error) return { ok: false, error: friendlyError(error) };
  return done(msg("Invitación revocada."));
}

export async function changeRoleAction(userId: string, role: Role): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_member_role", { p_user: userId, p_role: role });
  if (error) return { ok: false, error: friendlyError(error) };
  return done(msg("Rol actualizado."));
}

export async function removeMemberAction(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p_user: userId });
  if (error) return { ok: false, error: friendlyError(error) };
  return done(msg("Persona quitada del equipo. Sus ventas se conservan."));
}

/** Salir uno mismo del espacio (cualquier rol). */
export async function leaveOrganizationAction(): Promise<ActionResult> {
  const t = await getT();
  const me = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p_user: me.id });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: t("Has salido del espacio.") };
}

/** Cambia lo que ve y puede hacer un miembro (null = lo de su rol). */
export async function setPermissionsAction(userId: string, permissions: string[] | null): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_permissions", { p_user: userId, p_permissions: permissions });
  if (error) return { ok: false, error: friendlyError(error) };
  return done(permissions === null ? msg("Permisos restablecidos a los de su rol.") : msg("Permisos guardados."));
}
