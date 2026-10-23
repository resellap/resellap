"use server";
import { getT } from "@/i18n/server";
import { revalidatePath } from "next/cache";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function addTransfer(tr: { transfer_date: string; from_responsible_id: string; to_responsible_id: string; amount: number; notes?: string | null }): Promise<ActionResult> {
  const t = await getT();
  if (!(tr.amount > 0)) return { ok: false, error: t("El importe debe ser mayor que 0.") };
  if (tr.from_responsible_id === tr.to_responsible_id) return { ok: false, error: t("Quien paga y quien recibe deben ser personas distintas.") };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const { error } = await supabase.from("partner_transfers").insert({ ...tr, notes: tr.notes?.trim() || null, created_by: data?.claims?.sub ?? null });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/reparto");
  return { ok: true, message: t("Pago registrado.") };
}

export async function deleteTransfer(id: string): Promise<ActionResult> {
  const t = await getT();
  const supabase = await createClient();
  const { error } = await supabase.from("partner_transfers").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/reparto");
  return { ok: true, message: t("Pago eliminado.") };
}
