import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Gmail } from "./gmail";
import { storeListingImage } from "./images";
import { classify, extractProductImage, normalizeName, parseVintedSale, parseWallapopSale } from "./parse";

/**
 * Fotos de ventas anteriores (una sola vez por organización).
 *
 * Las ventas que se apuntaron antes de que la app guardara la foto del
 * anuncio (o a mano, o desde Excel) no la tienen. Aquí se buscan en Gmail los
 * correos de venta de Vinted y Wallapop de esas fechas y, cuando un correo
 * corresponde sin duda a UNA venta sin foto (misma plataforma, mismo precio,
 * fecha cercana y, si hace falta, el nombre del artículo), se copia su foto.
 * Si no hay coincidencia clara, la venta se queda como estaba.
 */

type Platform = "vinted" | "wallapop";

interface Candidate {
  id: string;
  platform: Platform;
  date: number; // día (ms UTC) de la venta
  amount: number;
  names: string[];
}

export interface BackfillResult {
  done: boolean; // false si se acabó el tiempo (se sigue en la próxima revisión)
  checked: number;
  photos: number;
  /** Último fallo con un correo concreto (para diagnosticar). */
  lastError?: string;
}

const DAY = 86_400_000;
const LOOKBACK_DAYS = 400;
const MAX_MESSAGES = 500;

const dayOf = (iso: string) => Date.parse(iso.slice(0, 10) + "T00:00:00Z");
const madridDay = (d: Date) => dayOf(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(d));

function tokens(s: string): Set<string> {
  return new Set(normalizeName(s).split(" ").filter((w) => w.length > 1));
}
function similarity(a: string, b: string): number {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const w of A) if (B.has(w)) common++;
  return common / Math.min(A.size, B.size);
}

/** Elige la venta del correo: una sola posible, o la única que se parece claramente por el nombre. */
export function pickSale(
  cands: Candidate[],
  mail: { platform: Platform; day: number; price: number; product: string },
): Candidate | null {
  const near = cands.filter((c) => c.platform === mail.platform && Math.abs(c.amount - mail.price) <= 0.01 && Math.abs(c.date - mail.day) <= 3 * DAY);
  if (near.length === 0) return null;
  const scored = near
    .map((c) => ({ c, s: Math.max(0, ...c.names.map((n) => similarity(n, mail.product))) }))
    .sort((a, b) => b.s - a.s || Math.abs(a.c.date - mail.day) - Math.abs(b.c.date - mail.day));
  if (near.length === 1) return scored[0].s >= 0.34 || !mail.product ? scored[0].c : null;
  // Varias del mismo precio y fechas: solo si el nombre deja clara una
  if (scored[0].s >= 0.5 && scored[0].s - scored[1].s >= 0.25) return scored[0].c;
  return null;
}

export async function backfillSalePhotos(db: SupabaseClient, org: string, gmail: Gmail, search: string, deadline: number): Promise<BackfillResult> {
  const result: BackfillResult = { done: false, checked: 0, photos: 0 };
  const since = new Date(Date.now() - LOOKBACK_DAYS * DAY).toISOString().slice(0, 10);

  const { data: plats } = await db.from("platforms").select("id, name").eq("organization_id", org);
  const platOf = new Map<string, Platform>();
  for (const p of plats ?? []) {
    const n = normalizeName(p.name as string);
    if (n.startsWith("vinted")) platOf.set(p.id as string, "vinted");
    else if (n.startsWith("wallapop")) platOf.set(p.id as string, "wallapop");
  }
  if (!platOf.size) return { ...result, done: true };

  const { data: sales, error } = await db
    .from("sales")
    .select("id, sale_date, platform_id, sale_items(quantity, unit_price, product_variants(name, products(name)))")
    .eq("organization_id", org)
    .eq("status", "activa")
    .is("image_path", null)
    .in("platform_id", [...platOf.keys()])
    .gte("sale_date", since)
    .limit(2000);
  if (error) throw new Error(`No se han podido leer las ventas sin foto: ${error.message}`);

  type Row = { id: string; sale_date: string; platform_id: string; sale_items: { quantity: number; unit_price: number; product_variants: { name: string | null; products: { name: string } | null } | null }[] };
  const cands: Candidate[] = ((sales ?? []) as unknown as Row[]).map((s) => ({
    id: s.id,
    platform: platOf.get(s.platform_id)!,
    date: dayOf(s.sale_date),
    amount: Math.round(s.sale_items.reduce((a, i) => a + Number(i.quantity) * Number(i.unit_price), 0) * 100) / 100,
    names: s.sale_items.flatMap((i) => [i.product_variants?.products?.name, i.product_variants?.name].filter((x): x is string => !!x)),
  }));
  if (!cands.length) return { ...result, done: true };

  const first = Math.min(...cands.map((c) => c.date)) - 3 * DAY;
  const last = Math.max(...cands.map((c) => c.date)) + 4 * DAY;
  const listed = await gmail.list(`${search} after:${Math.floor(first / 1000)} before:${Math.floor(last / 1000)}`, MAX_MESSAGES);

  const left = new Map(cands.map((c) => [c.id, c]));
  for (const m of listed) {
    if (!left.size) break;
    if (Date.now() > deadline) return result;
    result.checked++;
    try {
      const mail = await gmail.message(m.id);
      const { kind, platform } = classify({ from: mail.from, subject: mail.subject, text: mail.text, pdfNames: [] });
      if (!platform || (kind !== "vinted_venta" && kind !== "wallapop_venta")) continue;
      const parsed = kind === "vinted_venta" ? parseVintedSale(mail.text) : parseWallapopSale(mail.text);
      if (!parsed) continue;
      const sd = (parsed as { sale_date?: string | null }).sale_date;
      const saleDate = sd ? dayOf(sd) : madridDay(mail.receivedAt);
      const hit = pickSale([...left.values()], { platform, day: saleDate, price: parsed.price, product: parsed.product });
      if (!hit) continue;
      const path = await storeListingImage(db, org, mail.id, extractProductImage(mail.html, platform)).catch(() => null);
      if (!path) continue;
      const { error: upErr } = await db.from("sales").update({ image_path: path }).eq("organization_id", org).eq("id", hit.id).is("image_path", null);
      if (upErr) {
        await db.storage.from("sale-images").remove([path]);
        continue;
      }
      left.delete(hit.id);
      result.photos++;
    } catch (e) {
      // Un correo que no se puede leer no frena al resto
      result.lastError = e instanceof Error ? e.message.slice(0, 200) : "Error desconocido";
      console.error("Fotos de ventas anteriores:", result.lastError);
    }
  }
  return { ...result, done: true };
}
