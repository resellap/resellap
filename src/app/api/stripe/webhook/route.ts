import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, subscriptionOfEvent, syncSubscription } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
]);

/**
 * Avisos de Stripe. Solo se aceptan con la firma correcta. Cada evento se
 * procesa una vez; el estado se vuelve a pedir a Stripe (no se fía del
 * contenido). Nunca devuelve datos.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !process.env.STRIPE_SECRET_KEY?.trim()) return NextResponse.json({ error: "No configurado" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret, 300);
  } catch {
    return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  }
  if (!HANDLED.has(event.type)) return NextResponse.json({ received: true });

  const db = createAdminClient();
  const { data: seen } = await db.from("billing_events").select("id").eq("id", event.id).maybeSingle();
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  const subId = subscriptionOfEvent(event);
  let org: string | null = null;
  try {
    if (subId) org = await syncSubscription(subId, event.created);
  } catch {
    // Stripe lo reintentará
    return NextResponse.json({ error: "No procesado" }, { status: 500 });
  }
  // Se apunta después de aplicarlo: si algo falla antes, el reintento lo procesa
  await db.rpc("billing_record_event", {
    p_id: event.id,
    p_type: event.type,
    p_org: org,
    p_created: new Date(event.created * 1000).toISOString(),
  });
  if (org) await billingEmails(event.type, org);
  return NextResponse.json({ received: true });
}

/** Correos a los administradores del espacio (y aviso al dueño) según el evento. */
async function billingEmails(type: string, orgId: string) {
  const { orgAdmins, ownerEmail, sendTemplate } = await import("@/lib/mailer/send");
  const tpl = await import("@/lib/mailer/templates");
  const which =
    type === "checkout.session.completed"
      ? { user: tpl.subscriptionActive, owner: "Nueva suscripción" }
      : type === "invoice.payment_failed"
        ? { user: tpl.paymentFailed, owner: "Pago fallido" }
        : type === "customer.subscription.deleted"
          ? { user: tpl.subscriptionCanceled, owner: "Suscripción cancelada" }
          : null;
  if (!which) return;
  const admins = await orgAdmins(orgId);
  for (const a of admins) await sendTemplate(a.email, a.locale, which.user, { org: a.org });
  const owner = ownerEmail();
  if (owner && admins[0])
    await sendTemplate(owner, "es", tpl.ownerNotice, {
      title: `${which.owner}: ${admins[0].org}`,
      lines: ["Aviso automático de Stripe."],
      facts: [["Negocio", admins[0].org], ["Administrador", admins[0].email]],
    });
}
