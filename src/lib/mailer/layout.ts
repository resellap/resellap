import "server-only";
/**
 * Diseño común de todos los correos de Resellap: cabecera con el logo, tarjeta
 * blanca, botón verde, firma y pie con enlaces (ayuda, términos, privacidad).
 * HTML pensado para clientes de correo (tablas y estilos en línea) y una
 * versión en texto plano para los que no muestran HTML.
 */
import type { T } from "@/i18n/translate";
import { msg } from "@/i18n/translate";
import { SITE_URL } from "@/lib/site";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "steps"; items: { title: string; text: string }[] }
  | { kind: "quote"; label?: string; text: string }
  | { kind: "facts"; rows: [string, string][] }
  | { kind: "note"; text: string };

export type EmailContent = {
  /** Texto corto que se ve junto al asunto en la bandeja de entrada. */
  preheader: string;
  /** Título grande del correo. */
  heading: string;
  blocks: Block[];
  cta?: { label: string; href: string };
  /** Firma personal (Mauri) en vez de la del equipo. */
  personal?: boolean;
  /** Pie: «Recibes este correo porque…» */
  reason?: string;
};

export const SUPPORT_ADDRESS = "soporte@resellap.com";

const C = {
  bg: "#EEF2F0",
  card: "#FFFFFF",
  ink: "#0E1A14",
  soft: "#34443C",
  muted: "#6A7A72",
  line: "#E1E8E4",
  brand: "#36C784",
  brandDark: "#0F9D63",
  onBrand: "#03130B",
  tint: "#ECFBF3",
};
const FONT = "'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
/** Escapa y respeta los saltos de línea; **texto** pasa a negrita. */
const rich = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1");

function blockHtml(b: Block): string {
  const p = `margin:0 0 16px;font:400 16px/1.6 ${FONT};color:${C.soft}`;
  switch (b.kind) {
    case "p":
      return `<p style="${p}">${rich(b.text)}</p>`;
    case "h":
      return `<p style="margin:24px 0 10px;font:600 17px/1.4 ${FONT};color:${C.ink}">${rich(b.text)}</p>`;
    case "list":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px">${b.items
        .map((i) => `<tr><td valign="top" style="padding:4px 10px 4px 0;font:700 16px/1.6 ${FONT};color:${C.brandDark}">✓</td><td style="padding:4px 0;font:400 16px/1.6 ${FONT};color:${C.soft}">${rich(i)}</td></tr>`)
        .join("")}</table>`;
    case "steps":
      return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:4px 0 16px">${b.items
        .map(
          (s, n) =>
            `<tr><td valign="top" width="40" style="padding:0 0 14px"><div style="width:28px;height:28px;border-radius:14px;background:${C.tint};color:${C.brandDark};font:700 14px/28px ${FONT};text-align:center">${n + 1}</div></td><td style="padding:2px 0 14px"><div style="font:600 16px/1.4 ${FONT};color:${C.ink}">${rich(s.title)}</div><div style="font:400 15px/1.55 ${FONT};color:${C.muted}">${rich(s.text)}</div></td></tr>`,
        )
        .join("")}</table>`;
    case "quote":
      return `${b.label ? `<p style="margin:0 0 6px;font:600 13px/1.4 ${FONT};color:${C.muted};text-transform:uppercase;letter-spacing:.06em">${esc(b.label)}</p>` : ""}<div style="margin:0 0 18px;padding:14px 16px;border-left:3px solid ${C.brand};background:#F6F9F7;border-radius:0 10px 10px 0;font:400 15px/1.6 ${FONT};color:${C.soft}">${rich(b.text)}</div>`;
    case "facts":
      return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;border:1px solid ${C.line};border-radius:12px;border-collapse:separate">${b.rows
        .map(
          ([k, v], i) =>
            `<tr><td style="padding:12px 16px;${i ? `border-top:1px solid ${C.line};` : ""}font:400 14px/1.4 ${FONT};color:${C.muted}">${esc(k)}</td><td align="right" style="padding:12px 16px;${i ? `border-top:1px solid ${C.line};` : ""}font:600 15px/1.4 ${FONT};color:${C.ink}">${esc(v)}</td></tr>`,
        )
        .join("")}</table>`;
    case "note":
      return `<p style="margin:0 0 16px;padding:12px 14px;background:${C.tint};border-radius:10px;font:400 14px/1.55 ${FONT};color:${C.soft}">${rich(b.text)}</p>`;
  }
}

function blockText(b: Block): string {
  switch (b.kind) {
    case "p":
    case "note":
      return plain(b.text);
    case "h":
      return plain(b.text).toUpperCase();
    case "list":
      return b.items.map((i) => `- ${plain(i)}`).join("\n");
    case "steps":
      return b.items.map((s, n) => `${n + 1}. ${plain(s.title)}: ${plain(s.text)}`).join("\n");
    case "quote":
      return `${b.label ? `${b.label}:\n` : ""}> ${plain(b.text).replace(/\n/g, "\n> ")}`;
    case "facts":
      return b.rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  }
}

export function renderEmail(t: T, c: EmailContent): { html: string; text: string } {
  const site = SITE_URL;
  const links: [string, string][] = [
    [t(msg("Ayuda")), `${site}/ayuda`],
    [t(msg("Términos")), `${site}/terminos`],
    [t(msg("Privacidad")), `${site}/privacidad`],
    ["resellap.com", site],
  ];
  const signHtml = c.personal
    ? `<p style="margin:24px 0 0;font:400 16px/1.6 ${FONT};color:${C.soft}">${esc(t(msg("Un abrazo,")))}<br><strong style="color:${C.ink}">Mauri</strong><br><span style="font-size:14px;color:${C.muted}">${esc(t(msg("Fundador de Resellap")))}</span></p>`
    : `<p style="margin:24px 0 0;font:400 16px/1.6 ${FONT};color:${C.soft}">${esc(t(msg("Un saludo,")))}<br><strong style="color:${C.ink}">${esc(t(msg("El equipo de Resellap")))}</strong></p>`;
  const cta = c.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr><td style="border-radius:12px;background:${C.brand}"><a href="${esc(c.cta.href)}" style="display:inline-block;padding:14px 26px;font:700 16px/1.2 ${FONT};color:${C.onBrand};text-decoration:none;border-radius:12px">${esc(c.cta.label)} &rarr;</a></td></tr></table><p style="margin:0 0 16px;font:400 12.5px/1.5 ${FONT};color:${C.muted}">${esc(t(msg("Si el botón no funciona, copia este enlace:")))}<br><a href="${esc(c.cta.href)}" style="color:${C.brandDark};word-break:break-all">${esc(c.cta.href)}</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="${t.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(c.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(c.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="padding:0 6px 20px"><a href="${site}" style="text-decoration:none"><img src="${site}/icons/icon-192.png" width="36" height="36" alt="" style="vertical-align:middle;border-radius:9px;border:0"><span style="vertical-align:middle;margin-left:10px;font:700 21px/1 ${FONT};color:${C.ink};letter-spacing:-.01em">Resellap</span></a></td></tr>
<tr><td style="background:${C.card};border-radius:20px;padding:36px 32px;border:1px solid ${C.line}">
<div style="width:44px;height:4px;border-radius:2px;background:${C.brand};margin:0 0 22px"></div>
<h1 style="margin:0 0 18px;font:700 26px/1.25 ${FONT};color:${C.ink};letter-spacing:-.01em">${rich(c.heading)}</h1>
${c.blocks.map(blockHtml).join("\n")}
${cta}
${signHtml}
</td></tr>
<tr><td align="center" style="padding:24px 10px 6px;font:400 13px/1.7 ${FONT};color:${C.muted}">
${links.map(([l, h]) => `<a href="${esc(h)}" style="color:${C.muted};text-decoration:underline">${esc(l)}</a>`).join(" &nbsp;·&nbsp; ")}
<br>${esc(t(msg("¿Dudas? Responde a este correo o escríbenos a {email}."), { email: SUPPORT_ADDRESS }))}
<br>${esc(c.reason ?? t(msg("Recibes este correo porque tienes una cuenta en Resellap.")))}
</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    plain(c.heading),
    "",
    ...c.blocks.map((b) => blockText(b) + "\n"),
    c.cta ? `${c.cta.label}: ${c.cta.href}\n` : "",
    c.personal ? `${t(msg("Un abrazo,"))}\nMauri\n${t(msg("Fundador de Resellap"))}` : `${t(msg("Un saludo,"))}\n${t(msg("El equipo de Resellap"))}`,
    "",
    "—",
    links.map(([l, h]) => `${l}: ${h}`).join("\n"),
    t(msg("¿Dudas? Responde a este correo o escríbenos a {email}."), { email: SUPPORT_ADDRESS }),
    c.reason ?? t(msg("Recibes este correo porque tienes una cuenta en Resellap.")),
  ].join("\n");
  return { html, text };
}
