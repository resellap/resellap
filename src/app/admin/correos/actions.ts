"use server";
import { requireSession } from "@/lib/auth";
import { isLocale } from "@/i18n/config";
import type { ActionResult } from "@/lib/errors";
import { mailConfigured, ownerEmail, sendTemplate } from "@/lib/mailer/send";
import * as tpl from "@/lib/mailer/templates";

const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const LINK = "https://resellap.com/ayuda";

/** Ejemplos de cada correo con datos inventados. */
const SAMPLES = {
  welcome: () => [tpl.welcome, { name: "Lucía Pérez", orgName: "Gafas Málaga", trialEnd: day(7) }],
  invitation: () => [tpl.invitation, { who: "Mauri", org: "Gafas Málaga", role: "vendedor", link: LINK }],
  supportReceived: () => [tpl.supportReceived, { question: "¿Cómo cambio el precio de una venta ya registrada?" }],
  supportReply: () => [tpl.supportReply, { question: "¿Cómo cambio el precio de una venta ya registrada?", reply: "Abre la venta en Ventas y pulsa «Editar línea»." }],
  trialEnding: () => [tpl.trialEnding, { name: "Lucía", days: 2, end: day(2) }],
  trialEnded: () => [tpl.trialEnded, {}],
  subscriptionActive: () => [tpl.subscriptionActive, { org: "Gafas Málaga" }],
  paymentFailed: () => [tpl.paymentFailed, { org: "Gafas Málaga" }],
  subscriptionCanceled: () => [tpl.subscriptionCanceled, { org: "Gafas Málaga" }],
  deletionRequested: () => [tpl.deletionRequested, { org: "Gafas Málaga", purge: day(30) }],
  confirmSignup: () => [tpl.confirmSignup, { link: LINK }],
  recovery: () => [tpl.recovery, { link: LINK }],
  magicLink: () => [tpl.magicLink, { link: LINK }],
  reauthCode: () => [tpl.reauthCode, { code: "482913" }],
} as const;
export type SampleId = keyof typeof SAMPLES;

/** Envía uno o todos los correos de ejemplo al buzón de soporte. */
export async function sendTestEmailsAction(which: SampleId | "all", locale: string): Promise<ActionResult> {
  const u = await requireSession();
  if (!u.isPlatformAdmin) return { ok: false, error: "No autorizado." };
  if (!mailConfigured()) return { ok: false, error: "Falta RESEND_API_KEY o MAIL_FROM en Vercel (y un Redeploy)." };
  const to = ownerEmail() ?? u.email;
  if (!to || !isLocale(locale)) return { ok: false, error: "Datos no válidos." };
  const ids = (which === "all" ? Object.keys(SAMPLES) : [which]) as SampleId[];
  let ok = 0;
  for (const id of ids) {
    const [t, d] = SAMPLES[id]();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (await sendTemplate(to, locale, t as tpl.Template<any>, d)) ok++;
  }
  return ok === ids.length
    ? { ok: true, message: `${ok} correo(s) enviado(s) a ${to}.` }
    : { ok: false, error: `Se enviaron ${ok} de ${ids.length}. Revisa en Resend → Logs el motivo.` };
}
