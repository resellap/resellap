import "server-only";
/**
 * Textos de cada correo. Se escriben en español y se traducen con el
 * diccionario de la app al idioma de quien lo recibe.
 */
import type { Locale } from "@/i18n/config";
import { makeFormat, msg, type T } from "@/i18n/translate";
import { PRICE, SITE_URL, TRIAL_DAYS } from "@/lib/site";
import type { EmailContent } from "./layout";

export type Built = { subject: string; content: EmailContent };
export type Template<D> = (t: T, data: D) => Built;

const fmt = (l: Locale) => makeFormat(l);
const app = (path: string) => `${SITE_URL}${path}`;
const first = (name?: string | null) => (name ?? "").trim().split(/\s+/)[0] ?? "";

// ---------------------------------------------------------------------------
// Bienvenida y cuenta
// ---------------------------------------------------------------------------

export const welcome: Template<{ name?: string | null; orgName: string; trialEnd: string }> = (t, d) => {
  const n = first(d.name);
  return {
    subject: t(msg("Bienvenido a Resellap, {name} 👋"), { name: n || d.orgName }),
    content: {
      preheader: t(msg("Tu espacio «{org}» está listo. Así sacas partido a tus {days} días gratis."), { org: d.orgName, days: TRIAL_DAYS }),
      heading: n ? t(msg("¡Hola, {name}! Bienvenido a Resellap"), { name: n }) : t(msg("¡Bienvenido a Resellap!")),
      personal: true,
      blocks: [
        { kind: "p", text: t(msg("Gracias por confiar en Resellap. Tu espacio **{org}** ya está creado y tienes **{days} días gratis** para probarlo todo, hasta el {end}."), { org: d.orgName, days: TRIAL_DAYS, end: fmt(t.locale).longDate(d.trialEnd) }) },
        { kind: "p", text: t(msg("Resellap está pensado para que dejes de pelearte con hojas de cálculo: sabrás qué tienes, lo que te costó y lo que ganas con cada venta.")) },
        { kind: "h", text: t(msg("Empieza en 3 pasos")) },
        {
          kind: "steps",
          items: [
            { title: t(msg("Mete tu inventario")), text: t(msg("Importa tu Excel o crea tus productos con lo que te costaron.")) },
            { title: t(msg("Conecta tu Gmail")), text: t(msg("Las ventas de Vinted, Wallapop y eBay se detectan solas.")) },
            { title: t(msg("Confirma y envía")), text: t(msg("Revisa cada venta, marca el envío y sigue el paquete hasta que llega.")) },
          ],
        },
        { kind: "note", text: t(msg("Si te atascas en algo, responde a este correo: lo leo yo personalmente.")) },
      ],
      cta: { label: t(msg("Abrir Resellap")), href: app("/") },
    },
  };
};

export const invitation: Template<{ who: string; org: string; role: string; link: string }> = (t, d) => ({
  subject: t(msg("Invitación a {org} en Resellap"), { org: d.org }),
  content: {
    preheader: t(msg("{who} te invita a unirte a {org} en Resellap como {role}."), d),
    heading: t(msg("Te han invitado a {org}"), { org: d.org }),
    blocks: [
      { kind: "p", text: t(msg("{who} te invita a unirte a {org} en Resellap como {role}."), d) },
      { kind: "p", text: t(msg("Resellap es la herramienta del equipo para llevar el inventario, las ventas y los envíos.")) },
      { kind: "note", text: t(msg("El enlace caduca en 7 días y solo funciona con este correo.")) },
    ],
    cta: { label: t(msg("Aceptar invitación")), href: d.link },
    reason: t(msg("Recibes este correo porque alguien te ha invitado a su equipo en Resellap.")),
  },
});

// ---------------------------------------------------------------------------
// Soporte
// ---------------------------------------------------------------------------

export const supportReceived: Template<{ question: string }> = (t, d) => ({
  subject: t(msg("Hemos recibido tu consulta")),
  content: {
    preheader: t(msg("Te responderemos lo antes posible.")),
    heading: t(msg("Hemos recibido tu consulta")),
    blocks: [
      { kind: "p", text: t(msg("Gracias por escribirnos. Una persona del equipo la revisará y te responderemos lo antes posible, normalmente en menos de 24 horas.")) },
      { kind: "quote", label: t(msg("Tu pregunta")), text: d.question },
      { kind: "p", text: t(msg("Verás la respuesta en «Tus consultas», dentro de Ayuda, y también te llegará por correo.")) },
    ],
    cta: { label: t(msg("Ver mis consultas")), href: app("/ayuda") },
  },
});

export const supportReply: Template<{ question: string; reply: string }> = (t, d) => ({
  subject: t(msg("Respuesta a tu consulta en Resellap")),
  content: {
    preheader: d.reply.slice(0, 110),
    heading: t(msg("Tenemos respuesta para ti")),
    blocks: [
      { kind: "quote", label: t(msg("Tu pregunta")), text: d.question },
      { kind: "quote", label: t(msg("Nuestra respuesta")), text: d.reply },
      { kind: "p", text: t(msg("Si necesitas algo más, responde a este correo.")) },
    ],
    cta: { label: t(msg("Ver en Resellap")), href: app("/ayuda") },
    personal: true,
  },
});

// ---------------------------------------------------------------------------
// Prueba y suscripción
// ---------------------------------------------------------------------------

export const trialEnding: Template<{ name?: string | null; days: number; end: string }> = (t, d) => ({
  subject: d.days === 1 ? t(msg("Tu prueba de Resellap termina mañana")) : t(msg("Te quedan {days} días de prueba en Resellap"), { days: d.days }),
  content: {
    preheader: t(msg("Suscríbete por {price} al mes y sigue sin interrupciones."), { price: fmt(t.locale).money(PRICE) }),
    heading: d.days === 1 ? t(msg("Tu prueba termina mañana")) : t(msg("Te quedan {days} días de prueba"), { days: d.days }),
    blocks: [
      { kind: "p", text: t(msg("Tu prueba gratuita termina el **{end}**. Para seguir registrando ventas, compras y envíos, activa la suscripción."), { end: fmt(t.locale).longDate(d.end) }) },
      { kind: "list", items: [t(msg("Plan único: {price} al mes, todo incluido"), { price: fmt(t.locale).money(PRICE) }), t(msg("Usuarios del equipo incluidos")), t(msg("Sin permanencia: cancela cuando quieras"))] },
      { kind: "p", text: t(msg("Si no te suscribes, no perderás nada: tu espacio pasará a solo lectura y podrás exportar tus datos.")) },
    ],
    cta: { label: t(msg("Activar suscripción")), href: app("/suscripcion") },
  },
});

export const trialEnded: Template<Record<string, never>> = (t) => ({
  subject: t(msg("Tu prueba de Resellap ha terminado")),
  content: {
    preheader: t(msg("Tus datos están a salvo. Suscríbete para seguir trabajando.")),
    heading: t(msg("Tu prueba gratuita ha terminado")),
    blocks: [
      { kind: "p", text: t(msg("Esperamos que estos días te hayan servido. Tus datos están a salvo: puedes consultarlos y exportarlos cuando quieras.")) },
      { kind: "p", text: t(msg("Para volver a registrar ventas, compras y envíos, activa la suscripción por {price} al mes. Sin permanencia."), { price: fmt(t.locale).money(PRICE) }) },
      { kind: "note", text: t(msg("¿Algo no te convenció? Responde a este correo y cuéntamelo: me ayuda mucho a mejorar.")) },
    ],
    cta: { label: t(msg("Activar suscripción")), href: app("/suscripcion") },
    personal: true,
  },
});

export const subscriptionActive: Template<{ org: string }> = (t, d) => ({
  subject: t(msg("¡Suscripción activada! Gracias por confiar en Resellap")),
  content: {
    preheader: t(msg("Tu espacio {org} ya tiene acceso completo."), { org: d.org }),
    heading: t(msg("¡Gracias! Tu suscripción está activa")),
    blocks: [
      { kind: "p", text: t(msg("Tu espacio **{org}** ya tiene acceso completo a Resellap."), { org: d.org }) },
      { kind: "facts", rows: [[t(msg("Plan")), t(msg("Plan único"))], [t(msg("Precio")), `${fmt(t.locale).money(PRICE)} / ${t(msg("mes"))}`]] },
      { kind: "p", text: t(msg("Las facturas y el método de pago los gestionas desde Suscripción, cuando quieras.")) },
    ],
    cta: { label: t(msg("Ir a Resellap")), href: app("/") },
    personal: true,
  },
});

export const paymentFailed: Template<{ org: string }> = (t, d) => ({
  subject: t(msg("No hemos podido cobrar tu suscripción de Resellap")),
  content: {
    preheader: t(msg("Revisa tu método de pago para no perder el acceso.")),
    heading: t(msg("No se ha podido cobrar el último pago")),
    blocks: [
      { kind: "p", text: t(msg("El último cobro de la suscripción de **{org}** no se ha podido completar. Suele deberse a una tarjeta caducada o sin saldo."), { org: d.org }) },
      { kind: "p", text: t(msg("Lo volveremos a intentar en los próximos días. Para evitar que tu espacio pase a solo lectura, revisa tu método de pago.")) },
    ],
    cta: { label: t(msg("Revisar método de pago")), href: app("/suscripcion") },
  },
});

export const subscriptionCanceled: Template<{ org: string }> = (t, d) => ({
  subject: t(msg("Tu suscripción de Resellap se ha cancelado")),
  content: {
    preheader: t(msg("Tus datos siguen disponibles para consultarlos y exportarlos.")),
    heading: t(msg("Tu suscripción se ha cancelado")),
    blocks: [
      { kind: "p", text: t(msg("La suscripción de **{org}** ya no está activa. Tus datos no se han borrado: el espacio queda en solo lectura y puedes exportarlo cuando quieras."), { org: d.org }) },
      { kind: "p", text: t(msg("Si cambias de idea, puedes reactivarla en cualquier momento y todo seguirá donde lo dejaste.")) },
      { kind: "note", text: t(msg("¿Nos cuentas por qué te vas? Responde a este correo: cada respuesta la leo yo.")) },
    ],
    cta: { label: t(msg("Reactivar suscripción")), href: app("/suscripcion") },
    personal: true,
  },
});

export const deletionRequested: Template<{ org: string; purge: string }> = (t, d) => ({
  subject: t(msg("Has solicitado eliminar {org}"), { org: d.org }),
  content: {
    preheader: t(msg("Tienes 30 días para arrepentirte y exportar tus datos.")),
    heading: t(msg("Eliminación solicitada")),
    blocks: [
      { kind: "p", text: t(msg("Hemos recibido la solicitud para eliminar el espacio **{org}**. Desde ahora está en solo lectura."), { org: d.org }) },
      { kind: "facts", rows: [[t(msg("Se borrará definitivamente")), fmt(t.locale).longDate(d.purge)]] },
      { kind: "p", text: t(msg("Hasta esa fecha puedes exportar tus datos o anular la eliminación. Después no se podrá recuperar nada.")) },
      { kind: "note", text: t(msg("Si no has sido tú, entra en Resellap y anula la eliminación cuanto antes.")) },
    ],
    cta: { label: t(msg("Exportar o anular")), href: app("/suscripcion") },
  },
});

// ---------------------------------------------------------------------------
// Acceso (los manda Supabase a través de nuestro gancho)
// ---------------------------------------------------------------------------

export const confirmSignup: Template<{ link: string }> = (t, d) => ({
  subject: t(msg("Confirma tu correo para empezar con Resellap")),
  content: {
    preheader: t(msg("Un clic y tu cuenta estará lista.")),
    heading: t(msg("Confirma tu correo")),
    blocks: [
      { kind: "p", text: t(msg("¡Ya casi está! Pulsa el botón para confirmar tu correo y crear tu espacio de trabajo.")) },
      { kind: "note", text: t(msg("Si no te has registrado en Resellap, ignora este correo.")) },
    ],
    cta: { label: t(msg("Confirmar mi correo")), href: d.link },
    reason: t(msg("Recibes este correo porque alguien se ha registrado en Resellap con esta dirección.")),
  },
});

export const recovery: Template<{ link: string }> = (t, d) => ({
  subject: t(msg("Restablece tu contraseña de Resellap")),
  content: {
    preheader: t(msg("El enlace caduca en 1 hora.")),
    heading: t(msg("¿Has olvidado tu contraseña?")),
    blocks: [
      { kind: "p", text: t(msg("Pulsa el botón para elegir una contraseña nueva. El enlace caduca en 1 hora y solo se puede usar una vez.")) },
      { kind: "note", text: t(msg("Si no lo has pedido tú, ignora este correo: tu contraseña no cambiará.")) },
    ],
    cta: { label: t(msg("Elegir contraseña nueva")), href: d.link },
  },
});

export const magicLink: Template<{ link: string }> = (t, d) => ({
  subject: t(msg("Tu enlace para entrar en Resellap")),
  content: {
    preheader: t(msg("Entra sin contraseña con un clic.")),
    heading: t(msg("Entra en Resellap")),
    blocks: [
      { kind: "p", text: t(msg("Pulsa el botón para entrar. El enlace caduca en 1 hora y solo se puede usar una vez.")) },
      { kind: "note", text: t(msg("Si no lo has pedido tú, ignora este correo.")) },
    ],
    cta: { label: t(msg("Entrar en Resellap")), href: d.link },
  },
});

export const emailChange: Template<{ link: string; newEmail: string }> = (t, d) => ({
  subject: t(msg("Confirma el cambio de correo en Resellap")),
  content: {
    preheader: t(msg("Confirma tu nueva dirección: {email}."), { email: d.newEmail }),
    heading: t(msg("Confirma el cambio de correo")),
    blocks: [
      { kind: "p", text: t(msg("Has pedido cambiar el correo de tu cuenta a **{email}**. Pulsa el botón para confirmarlo."), { email: d.newEmail }) },
      { kind: "note", text: t(msg("Si no has sido tú, cambia tu contraseña y escríbenos.")) },
    ],
    cta: { label: t(msg("Confirmar cambio")), href: d.link },
  },
});

export const reauthCode: Template<{ code: string }> = (t, d) => ({
  subject: t(msg("Tu código de verificación de Resellap: {code}"), { code: d.code }),
  content: {
    preheader: t(msg("Usa este código para confirmar que eres tú.")),
    heading: t(msg("Tu código de verificación")),
    blocks: [
      { kind: "facts", rows: [[t(msg("Código")), d.code]] },
      { kind: "p", text: t(msg("Escríbelo en Resellap para confirmar que eres tú. Caduca en unos minutos.")) },
      { kind: "note", text: t(msg("No compartas este código con nadie. Nadie de Resellap te lo pedirá nunca.")) },
    ],
  },
});

// ---------------------------------------------------------------------------
// Para el dueño de Resellap
// ---------------------------------------------------------------------------

export const ownerNotice: Template<{ title: string; lines: string[]; facts?: [string, string][]; link?: { href: string; label: string } }> = (_t, d) => ({
  subject: d.title,
  content: {
    preheader: d.lines[0] ?? d.title,
    heading: d.title,
    blocks: [...(d.facts?.length ? [{ kind: "facts" as const, rows: d.facts }] : []), ...d.lines.map((text) => ({ kind: "p" as const, text }))],
    cta: d.link,
    reason: "Aviso interno para el equipo de Resellap.",
  },
});
