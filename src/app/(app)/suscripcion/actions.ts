"use server";
import { getT } from "@/i18n/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function requestDeletionAction(confirmName: string): Promise<ActionResult> {
  const t = await getT();
  const me = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_org_deletion", { p_confirm_name: confirmName });
  if (error) return { ok: false, error: friendlyError(error) };
  if (me.orgId) {
    const { orgAdmins, sendTemplate } = await import("@/lib/mailer/send");
    const { deletionRequested } = await import("@/lib/mailer/templates");
    const purge = new Date(Date.now() + 30 * 86_400_000).toISOString();
    for (const a of await orgAdmins(me.orgId)) await sendTemplate(a.email, a.locale, deletionRequested, { org: a.org, purge });
  }
  revalidatePath("/", "layout");
  return { ok: true, message: t("Eliminación solicitada. Tienes 30 días para anularla y exportar tus datos.") };
}

export async function cancelDeletionAction(): Promise<ActionResult> {
  const t = await getT();
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_org_deletion");
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: t("Eliminación anulada. El espacio vuelve a estar activo.") };
}
