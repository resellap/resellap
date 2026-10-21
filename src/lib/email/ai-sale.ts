import "server-only";
import { testOnlyEnv } from "@/lib/test-env";
import { normalizeName, PLATFORM_LABEL, type Platform } from "./parse";

/**
 * Ventas de eBay, Milanuncios y Facebook Marketplace leídas con IA (Gemini).
 *
 * Estas plataformas cambian sus correos a menudo y no hay un formato fijo,
 * así que la IA lee el texto y devuelve los datos de la venta. Solo cuenta
 * como venta si TÚ eres el vendedor (no tus compras, ni avisos, ni publicidad).
 * Como siempre, la venta queda en «Ventas detectadas» para que la confirmes.
 */
export interface AiSale {
  account: string | null;
  account_norm: string | null;
  buyer: string | null;
  product: string;
  product_norm: string;
  price: number;
  shipping: number | null;
  total: number | null;
  amounts: number[];
  sale_date: string | null;
  order_id: string | null;
  doubt: string | null;
  read_by: "ia";
}

export type AiResult = { kind: "sale"; sale: AiSale } | { kind: "not_sale"; reason: string } | { kind: "unavailable"; reason: string };

const GEMINI_URL = testOnlyEnv("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const MAX_TEXT = 12_000;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    es_venta: { type: "BOOLEAN", description: "true solo si el destinatario del correo HA VENDIDO un artículo (es el vendedor) y el correo confirma la venta o el pago." },
    motivo: { type: "STRING", description: "Si no es venta, por qué (compra propia, aviso, publicidad, mensaje, oferta…)." },
    producto: { type: "STRING", description: "Título del artículo vendido, tal cual aparece." },
    precio: { type: "NUMBER", description: "Precio del artículo en euros, sin envío." },
    envio: { type: "NUMBER", description: "Gastos de envío en euros, si aparecen." },
    total: { type: "NUMBER", description: "Total pagado por el comprador en euros, si aparece." },
    comprador: { type: "STRING", description: "Nombre o usuario del comprador, si aparece." },
    cuenta: { type: "STRING", description: "Nombre o usuario del vendedor (a quien va el correo), si aparece." },
    fecha: { type: "STRING", description: "Fecha de la venta en formato AAAA-MM-DD, si aparece." },
    pedido: { type: "STRING", description: "Número de pedido o transacción, si aparece." },
    unidades: { type: "NUMBER", description: "Unidades vendidas (1 si no se indica)." },
  },
  required: ["es_venta"],
};

function prompt(platform: Platform, subject: string, text: string): string {
  return [
    `Correo de ${PLATFORM_LABEL[platform]} recibido por un revendedor en España.`,
    "Decide si es la confirmación de que ÉL ha vendido un artículo (no una compra suya, ni un aviso de oferta, mensaje, valoración o publicidad).",
    "Si lo es, extrae los datos. No inventes nada: deja vacío lo que no aparezca. Importes en euros como número (60,50 € → 60.5).",
    "",
    `Asunto: ${subject}`,
    "Texto:",
    text.slice(0, MAX_TEXT),
  ].join("\n");
}

type Raw = {
  es_venta?: boolean;
  motivo?: string;
  producto?: string;
  precio?: number;
  envio?: number;
  total?: number;
  comprador?: string;
  cuenta?: string;
  fecha?: string;
  pedido?: string;
  unidades?: number;
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null);
const str = (v: unknown, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Convierte la respuesta de la IA en los datos de la venta (con comprobaciones). Exportada para las pruebas. */
export function toAiResult(raw: Raw, receivedAt: Date): AiResult {
  if (!raw.es_venta) return { kind: "not_sale", reason: str(raw.motivo) ?? "No es una venta." };
  const product = str(raw.producto);
  const price = num(raw.precio);
  if (!product || !price) return { kind: "not_sale", reason: "La IA no ha encontrado el artículo o el precio." };
  const shipping = num(raw.envio);
  const total = num(raw.total);
  const date = str(raw.fecha, 10);
  const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Math.abs(Date.parse(date) - receivedAt.getTime()) < 60 * 86_400_000 ? date : null;
  const units = num(raw.unidades);
  const doubts: string[] = ["Leída con IA: revisa el producto y el precio."];
  if (total !== null && Math.abs(price + (shipping ?? 0) - total) > 0.01) doubts.push("Los importes no cuadran (artículo + envío ≠ total).");
  if (units && units > 1) doubts.push(`El correo habla de ${units} unidades: la venta se crea con 1; ajústala si hace falta.`);
  const account = str(raw.cuenta, 60);
  return {
    kind: "sale",
    sale: {
      account,
      account_norm: account ? normalizeName(account) : null,
      buyer: str(raw.comprador, 80),
      product,
      product_norm: normalizeName(product),
      price,
      shipping,
      total,
      amounts: [price, shipping, total].filter((x): x is number => x !== null),
      sale_date: validDate,
      order_id: str(raw.pedido, 60)?.replace(/[^A-Za-z0-9-]/g, "") || null,
      doubt: doubts.join(" "),
      read_by: "ia",
    },
  };
}

export async function readSaleWithAi(platform: Platform, subject: string, text: string, receivedAt: Date): Promise<AiResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { kind: "unavailable", reason: "Falta la clave de Gemini (GEMINI_API_KEY) para leer correos de esta plataforma." };
  const custom = process.env.GEMINI_MODEL?.trim();
  let last = "";
  for (const model of custom ? [custom] : MODELS) {
    try {
      const res = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt(platform, subject, text) }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1500, responseMimeType: "application/json", responseSchema: SCHEMA },
        }),
        signal: AbortSignal.timeout(25_000),
        cache: "no-store",
      });
      if (!res.ok) {
        last = `Gemini ${res.status}`;
        continue;
      }
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      const out = (json.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought && p.text).map((p) => p.text).join("");
      if (!out.trim()) continue;
      return toAiResult(JSON.parse(out) as Raw, receivedAt);
    } catch (e) {
      last = e instanceof Error ? e.message : "error";
    }
  }
  return { kind: "unavailable", reason: `No se ha podido leer el correo con IA (${last || "sin respuesta"}). Se reintentará.` };
}
