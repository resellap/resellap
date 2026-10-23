"use server";
import { getT } from "@/i18n/server";
import { revalidatePath } from "next/cache";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type ResponsibleInput = { id?: string; name: string; email?: string | null; active: boolean; is_partner: boolean; profile_id?: string | null };

export async function saveResponsible(r: ResponsibleInput): Promise<ActionResult<string>> {
  const t = await getT();
  const name = r.name.trim();
  if (!name) return { ok: false, error: t("El nombre es obligatorio.") };
  const row = { name, email: r.email?.trim() || null, active: r.active, is_partner: r.is_partner, profile_id: r.profile_id || null };
  const supabase = await createClient();
  const res = r.id ? await supabase.from("responsibles").update(row).eq("id", r.id).select("id").single() : await supabase.from("responsibles").insert(row).select("id").single();
  if (res.error) return { ok: false, error: friendlyError(res.error) };
  for (const p of ["/responsables", "/ventas", "/reparto", "/equipo"]) revalidatePath(p, "layout");
  return { ok: true, data: res.data.id, message: t("Responsable guardado.") };
}
