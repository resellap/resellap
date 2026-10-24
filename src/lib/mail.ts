import "server-only";
import { tSync } from "@/i18n/server";
import { renderEmail } from "@/lib/mailer/layout";
import { deliver, mailConfigured } from "@/lib/mailer/send";

/**
 * Correo sencillo (un texto y, si hace falta, un botón) con el diseño de
 * Resellap. Para los correos con plantilla propia, ver src/lib/mailer.
 * Sin RESEND_API_KEY y MAIL_FROM no se envía nada.
 */
export { mailConfigured };

export async function sendMail(to: string, subject: string, text: string, link?: { href: string; label: string }): Promise<boolean> {
  if (!mailConfigured()) return false;
  const t = tSync();
  const { html, text: plain } = renderEmail(t, {
    preheader: text.split("\n")[0].slice(0, 120),
    heading: subject,
    blocks: text.split(/\n{2,}/).map((p) => ({ kind: "p" as const, text: p })),
    cta: link,
  });
  return deliver(to, subject, html, plain);
}
