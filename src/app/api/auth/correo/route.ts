import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { deliver, localeOfUser, mailConfigured } from "@/lib/mailer/send";
import { renderEmail } from "@/lib/mailer/layout";
import { tFor } from "@/i18n/server";
import { confirmSignup, emailChange, magicLink, reauthCode, recovery } from "@/lib/mailer/templates";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Gancho «Send Email» de Supabase Auth: en vez de los correos básicos de
 * Supabase, se envían los de Resellap (diseño propio, idioma de cada usuario).
 * Se activa en Supabase → Authentication → Hooks → Send Email (HTTPS) con esta
 * dirección; el secreto que da Supabase va en SEND_EMAIL_HOOK_SECRET.
 */
type Payload = {
  user: { id: string; email: string; new_email?: string; user_metadata?: Record<string, unknown> };
  email_data: { token: string; token_hash: string; redirect_to: string; email_action_type: string; token_new?: string; token_hash_new?: string };
};

const fail = (status: number, message: string) => NextResponse.json({ error: { http_code: status, message } }, { status });

function verify(body: string, req: NextRequest, secret: string): boolean {
  const id = req.headers.get("webhook-id");
  const ts = req.headers.get("webhook-timestamp");
  const sigs = req.headers.get("webhook-signature");
  if (!id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^v1,/, "").replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sigs.split(" ").some((s) => {
    const got = Buffer.from(s.replace(/^v1,/, ""), "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

/** Enlace que abre /auth/confirmar con el token (crea la sesión y sigue). */
function link(redirectTo: string, tokenHash: string, type: string): string {
  let u: URL;
  try {
    u = new URL(redirectTo || `${SITE_URL}/auth/confirmar`);
    if (!u.pathname.startsWith("/auth/confirmar")) u = new URL(`${SITE_URL}/auth/confirmar?next=${encodeURIComponent(u.pathname + u.search)}`);
  } catch {
    u = new URL(`${SITE_URL}/auth/confirmar`);
  }
  u.searchParams.set("token_hash", tokenHash);
  u.searchParams.set("type", type);
  return u.toString();
}

export async function POST(request: NextRequest) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET?.trim();
  if (!secret) return fail(503, "Hook not configured");
  const body = await request.text();
  if (!verify(body, request, secret)) return fail(401, "Invalid signature");
  if (!mailConfigured()) return fail(503, "Email provider not configured");
  let p: Payload;
  try {
    p = JSON.parse(body) as Payload;
  } catch {
    return fail(400, "Invalid payload");
  }
  const meta = p.user.user_metadata?.language;
  const locale: Locale = isLocale(meta) ? meta : p.user.id ? await localeOfUser(p.user.id) : DEFAULT_LOCALE;
  const t = await tFor(locale);
  const d = p.email_data;
  const type = d.email_action_type;
  let to = p.user.email;
  let built;
  if (type === "signup" || type === "invite") built = confirmSignup(t, { link: link(d.redirect_to, d.token_hash, type) });
  else if (type === "recovery") built = recovery(t, { link: link(d.redirect_to, d.token_hash, "recovery") });
  else if (type === "magiclink") built = magicLink(t, { link: link(d.redirect_to, d.token_hash, "magiclink") });
  else if (type === "email_change") {
    to = p.user.new_email || p.user.email;
    built = emailChange(t, { link: link(d.redirect_to, d.token_hash_new || d.token_hash, "email_change"), newEmail: to });
  } else if (type === "reauthentication") built = reauthCode(t, { code: d.token });
  else built = magicLink(t, { link: link(d.redirect_to, d.token_hash, "email") });
  const { html, text } = renderEmail(t, built.content);
  const ok = await deliver(to, built.subject, html, text);
  return ok ? NextResponse.json({}) : fail(502, "Email not sent");
}
