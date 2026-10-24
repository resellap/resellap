import "server-only";
/**
 * Envío de los correos con Resend, en el idioma de quien los recibe.
 * Sin RESEND_API_KEY y MAIL_FROM no se envía nada (devuelve false) y la app
 * sigue funcionando igual.
 */
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { tFor } from "@/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderEmail } from "./layout";
import type { Template } from "./templates";

export function mailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY?.trim() && !!process.env.MAIL_FROM?.trim();
}

/** Correo del dueño de Resellap (avisos internos). */
export function ownerEmail(): string | null {
  return process.env.SUPPORT_EMAIL?.trim() || null;
}

export async function deliver(to: string | string[], subject: string, html: string, text: string): Promise<boolean> {
  if (!mailConfigured()) return false;
  const replyTo = process.env.MAIL_REPLY_TO?.trim() || ownerEmail();
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM!.trim(),
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("Correo no enviado:", res.status);
    return res.ok;
  } catch (e) {
    console.error("Correo no enviado:", (e as Error)?.name);
    return false;
  }
}

/** Monta la plantilla en el idioma indicado y la envía. Nunca lanza errores. */
export async function sendTemplate<D>(to: string, locale: Locale, tpl: Template<D>, data: D): Promise<boolean> {
  try {
    const t = await tFor(locale);
    const built = tpl(t, data);
    const { html, text } = renderEmail(t, built.content);
    return await deliver(to, built.subject, html, text);
  } catch (e) {
    console.error("Correo no montado:", (e as Error)?.message);
    return false;
  }
}

/** Idioma guardado de un usuario (Ajustes) o el que eligió al registrarse. */
export async function localeOfUser(userId: string): Promise<Locale> {
  try {
    const db = createAdminClient();
    const { data } = await db.from("user_preferences").select("prefs").eq("user_id", userId).maybeSingle();
    const l = (data?.prefs as { language?: string } | null)?.language;
    if (isLocale(l)) return l;
    const { data: u } = await db.auth.admin.getUserById(userId);
    const m = u.user?.user_metadata?.language;
    if (isLocale(m)) return m;
  } catch {
    // idioma por defecto
  }
  return DEFAULT_LOCALE;
}

/** Idioma de un usuario a partir de su correo. */
export async function localeOfEmail(email: string): Promise<Locale> {
  try {
    const { data } = await createAdminClient().from("profiles").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
    if (data?.id) return localeOfUser(data.id as string);
  } catch {
    // idioma por defecto
  }
  return DEFAULT_LOCALE;
}

/** Administradores de un espacio con su correo, nombre e idioma. */
export async function orgAdmins(orgId: string): Promise<{ email: string; name: string | null; locale: Locale; org: string }[]> {
  try {
    const db = createAdminClient();
    const [{ data: org }, { data: members }] = await Promise.all([
      db.from("organizations").select("name").eq("id", orgId).maybeSingle(),
      db.from("memberships").select("user_id, role").eq("organization_id", orgId).eq("role", "admin"),
    ]);
    const ids = (members ?? []).map((m) => m.user_id as string);
    if (!ids.length) return [];
    const { data: profiles } = await db.from("profiles").select("id, email, full_name, active").in("id", ids);
    const out = [];
    for (const p of profiles ?? []) {
      if (!p.email || p.active === false) continue;
      out.push({ email: p.email as string, name: (p.full_name as string | null) ?? null, locale: await localeOfUser(p.id as string), org: (org?.name as string) ?? "" });
    }
    return out;
  } catch {
    return [];
  }
}
