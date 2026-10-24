import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { orgAdmins, sendTemplate } from "@/lib/mailer/send";
import { trialEnded, trialEnding } from "@/lib/mailer/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 86_400_000;

/**
 * Tarea diaria (Vercel Cron, ver vercel.json): avisa del final de la prueba.
 *  · Le quedan 2 días → «Te quedan 2 días de prueba».
 *  · Terminó en las últimas 24 h y no se ha suscrito → «Tu prueba ha terminado».
 * Cada espacio cae en cada ventana una sola vez, así que no se repiten.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const db = createAdminClient();
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const [ending, ended] = await Promise.all([
    db.from("subscriptions").select("organization_id, trial_ends_at").eq("status", "trialing").eq("comped", false).gte("trial_ends_at", iso(now + DAY)).lt("trial_ends_at", iso(now + 2 * DAY)),
    db.from("subscriptions").select("organization_id, trial_ends_at").eq("status", "trialing").eq("comped", false).gte("trial_ends_at", iso(now - DAY)).lt("trial_ends_at", iso(now)),
  ]);
  let sent = 0;
  for (const s of ending.data ?? []) {
    const days = Math.max(1, Math.ceil((Date.parse(s.trial_ends_at as string) - now) / DAY));
    for (const a of await orgAdmins(s.organization_id as string)) if (await sendTemplate(a.email, a.locale, trialEnding, { name: a.name, days, end: s.trial_ends_at as string })) sent++;
  }
  for (const s of ended.data ?? []) {
    for (const a of await orgAdmins(s.organization_id as string)) if (await sendTemplate(a.email, a.locale, trialEnded, {})) sent++;
  }
  return NextResponse.json({ ok: true, ending: ending.data?.length ?? 0, ended: ended.data?.length ?? 0, sent });
}
