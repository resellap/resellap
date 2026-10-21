import "server-only";
import { pdfText } from "@/lib/email/images";
import { findTrackingCodes } from "@/lib/email/parse";
import { testOnlyEnv } from "@/lib/test-env";

/**
 * Código de seguimiento de Correos leído de una etiqueta subida a mano.
 * - PDF con texto: se lee el texto directamente.
 * - Imagen (o PDF escaneado): se transcribe con Gemini, si está configurado.
 * Solo se aceptan formatos de Correos: PQ… (nacional) o 2 letras + 9 cifras + ES.
 */
export const CORREOS_CODE = /^(PQ[A-Z0-9]{14,24}|[A-Z]{2}\d{9}ES)$/;

export function correosCodeFrom(text: string): string | null {
  return findTrackingCodes(text).find((c) => CORREOS_CODE.test(c)) ?? null;
}

const GEMINI_URL = testOnlyEnv("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

async function transcribe(buf: Buffer, mime: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return "";
  const custom = process.env.GEMINI_MODEL?.trim();
  for (const model of custom ? [custom] : MODELS) {
    try {
      const res = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { inline_data: { mime_type: mime, data: buf.toString("base64") } },
              { text: "Es una etiqueta de envío. Copia exactamente todo el texto que aparece (códigos incluidos, con sus letras y números tal cual). Solo el texto, sin comentarios." },
            ],
          }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0 },
        }),
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      const text = (json.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought && p.text).map((p) => p.text).join("\n");
      if (text.trim()) return text;
    } catch {
      // siguiente modelo
    }
  }
  return "";
}

export async function readCorreosCode(buf: Buffer, mime: string): Promise<string | null> {
  const isPdf = mime === "application/pdf" || buf.subarray(0, 5).toString("latin1") === "%PDF-";
  if (isPdf) {
    const code = correosCodeFrom(await pdfText(buf));
    if (code) return code;
    return correosCodeFrom(await transcribe(buf, "application/pdf"));
  }
  if (!IMAGE_TYPES.has(mime)) return null;
  return correosCodeFrom(await transcribe(buf, mime));
}
