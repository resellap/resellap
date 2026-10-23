"use server";
/**
 * Ayuda, soporte y feedback · parte de servidor.
 *
 * - Todo pasa por funciones de la base de datos que comprueban la sesión y el
 *   espacio; aquí no se usa la clave de servicio.
 * - La IA (Gemini) solo recibe la pregunta y el texto de la ayuda; nunca datos
 *   del negocio.
 * - Si existe SUPPORT_EMAIL, se avisa por correo de cada feedback y de cada
 *   duda que la IA no ha resuelto.
 */
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { sendMail } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";
import { testOnlyEnv } from "@/lib/test-env";
import { faqAsText } from "./faq";

const GEMINI_URL = testOnlyEnv("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-lite"];

const page = z.string().trim().max(300).optional();

async function notifySupport(subject: string, text: string) {
  const to = process.env.SUPPORT_EMAIL?.trim();
  if (!to) return;
  const host = (await headers()).get("host");
  await sendMail(to, subject, text, host ? { href: `https://${host}/admin/soporte`, label: "Abrir el panel de soporte" } : undefined);
}

// ---------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------
const feedbackSchema = z.object({
  kind: z.enum(["idea", "fallo", "otro"]),
  message: z.string().trim().min(3, "Escribe tu mensaje.").max(4000, "El mensaje admite como máximo 4.000 caracteres."),
  page,
  screenshot: z.string().max(300).optional(),
});

export async function sendFeedback(input: z.infer<typeof feedbackSchema>): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.orgId) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  const f = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_feedback", { p_kind: f.kind, p_message: f.message, p_page: f.page ?? null, p_screenshot: f.screenshot ?? null });
  if (error) return { ok: false, error: friendlyError(error) };
  const label = { idea: "Idea", fallo: "Fallo", otro: "Comentario" }[f.kind];
  await notifySupport(`Feedback · ${label} · ${user.orgName ?? ""}`, `${user.email} (${user.orgName ?? "sin espacio"}) en ${f.page ?? "—"}:\n\n${f.message}`);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Dudas: primero la IA, si no sirve, soporte
// ---------------------------------------------------------------------
const SYSTEM = `Eres el asistente de ayuda de Resellap, una aplicación web para gestionar el inventario y las ventas de segunda mano (Vinted, Wallapop, eBay…).
Responde en español de España, claro y breve (máximo 120 palabras), con pasos numerados si hace falta.
Básate SOLO en la ayuda de abajo. Si la respuesta no está en la ayuda o no estás seguro, dilo con sinceridad y sugiere enviar la duda a soporte; no inventes botones, pantallas ni funciones.
Cuando nombres una pantalla, escribe un enlace en formato Markdown con su ruta, por ejemplo [Nueva venta](/ventas/nueva). Usa solo rutas que aparezcan en la ayuda.
No uses negritas, títulos ni otros formatos.

AYUDA DE RESELLAP:
`;

type GeminiResponse = { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };

async function askGemini(question: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const custom = process.env.GEMINI_MODEL?.trim();
  for (const model of custom ? [custom] : MODELS) {
    try {
      const res = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM + faqAsText() }] },
          contents: [{ role: "user", parts: [{ text: question }] }],
          generationConfig: { maxOutputTokens: 1200, temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      });
      if (!res.ok) {
        console.error("Ayuda IA:", model, res.status);
        continue;
      }
      const json = (await res.json()) as GeminiResponse;
      const text = (json.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought && typeof p.text === "string")
        .map((p) => p.text)
        .join("")
        .trim();
      if (text) return text.slice(0, 6000);
    } catch (e) {
      console.error("Ayuda IA:", model, (e as Error)?.name);
    }
  }
  return null;
}

const askSchema = z.object({ question: z.string().trim().min(3, "Escribe tu pregunta.").max(2000, "La pregunta admite como máximo 2.000 caracteres."), page });

export async function askSupport(input: z.infer<typeof askSchema>): Promise<ActionResult<{ id: number; answer: string | null }>> {
  const user = await getCurrentUser();
  if (!user?.orgId) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  const parsed = askSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("support_ask", { p_question: parsed.data.question, p_page: parsed.data.page ?? null, p_direct: false });
  if (error) return { ok: false, error: friendlyError(error) };
  const answer = await askGemini(parsed.data.question);
  if (answer) await supabase.rpc("support_set_ai_answer", { p_id: id, p_answer: answer });
  return { ok: true, data: { id: Number(id), answer } };
}

/** Respuesta a «¿Te ha servido?». Si no, la duda pasa a soporte. */
export async function resolveSupport(id: number, resolved: boolean, question: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.orgId) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  if (!Number.isSafeInteger(id)) return { ok: false, error: "Datos no válidos." };
  const supabase = await createClient();
  const { data: changed, error } = await supabase.rpc("support_resolve", { p_id: id, p_resolved: resolved });
  if (error) return { ok: false, error: friendlyError(error) };
  if (changed && !resolved) await notifySupport(`Duda sin resolver · ${user.orgName ?? ""}`, `${user.email} (${user.orgName ?? "sin espacio"}):\n\n${question.slice(0, 2000)}`);
  revalidatePath("/ayuda");
  return { ok: true };
}

/** Enviar la duda directamente a soporte (sin IA). */
export async function sendToSupport(input: z.infer<typeof askSchema>): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.orgId) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  const parsed = askSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("support_ask", { p_question: parsed.data.question, p_page: parsed.data.page ?? null, p_direct: true });
  if (error) return { ok: false, error: friendlyError(error) };
  await notifySupport(`Nueva consulta · ${user.orgName ?? ""}`, `${user.email} (${user.orgName ?? "sin espacio"}):\n\n${parsed.data.question}`);
  revalidatePath("/ayuda");
  return { ok: true };
}

/** Carpeta donde el navegador puede subir la captura del feedback. */
export async function feedbackFolder(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.orgId ? `${user.orgId}/${user.id}` : null;
}
