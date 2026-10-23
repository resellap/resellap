"use server";
import { getT } from "@/i18n/server";
import type { ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function changeOwnPassword(password: string): Promise<ActionResult> {
  const t = await getT();
  if (password.length < 8) return { ok: false, error: t("La contraseña debe tener al menos 8 caracteres.") };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: t("Contraseña cambiada.") };
}
