"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prefsSchema, type StoredPrefs } from "@/lib/preferences";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale } from "./config";

/** Cambia el idioma: en este navegador (cookie) y, con sesión, en tus preferencias. */
export async function setLanguage(locale: string): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) return { ok: false };
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  const user = await getCurrentUser();
  if (user?.active) {
    const supabase = await createClient();
    const { data } = await supabase.from("user_preferences").select("prefs").eq("user_id", user.id).maybeSingle();
    const next = prefsSchema.safeParse({ ...((data?.prefs as StoredPrefs) ?? {}), language: locale });
    if (next.success) {
      await supabase.from("user_preferences").upsert({ user_id: user.id, prefs: next.data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    }
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
