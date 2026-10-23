"use server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { carrierMark, platformMark } from "@/lib/carriers";
import { createAdminClient } from "@/lib/supabase/admin";
import { readCorreosCode } from "@/lib/tracking/label-code";
import { callRpc } from "@/lib/rpc";
import { runTracking } from "@/lib/tracking/service";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { AvailableLot } from "@/lib/types";

export async function getLots(variantId: string): Promise<ActionResult<AvailableLot[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_lots", {
    p_variant_id: variantId,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, data: (data ?? []) as AvailableLot[] };
}

export type NewSale = {
  /** Identificador de este intento: si llega dos veces, se registra una sola venta. */
  client_request_id?: string;
  sale_date: string;
  responsible_id?: string | null;
  platform_id: string;
  carrier_id?: string | null;
  mobile_device_id?: string | null;
  shipping_status?: "pendiente" | "enviado" | null;
  external_reference?: string | null;
  notes?: string | null;
  items: {
    variant_id: string;
    lot_id: string;
    quantity: number;
    unit_price: number;
    notes?: string | null;
  }[];
};

export async function createSale(sale: NewSale): Promise<ActionResult<string>> {
  return callRpc<string>("create_sale", { p: sale }, ["/ventas", "/"], "Venta registrada.");
}

export async function updateSale(patch: Record<string, unknown> & { id: string }): Promise<ActionResult> {
  const res = await callRpc<undefined>("update_sale", { p: patch }, ["/ventas"], "Cambios guardados.");
  // Marcada como enviada a mano: empieza el seguimiento (si tiene código)
  if (res.ok && patch.shipping_status === "enviado") after(() => runTracking({ saleIds: [patch.id] }).catch(() => undefined));
  if (res.ok && typeof patch.shipping_label_path === "string" && patch.shipping_label_path) {
    const code = await codeFromWallapopLabel(patch.id).catch(() => null);
    res.message = code ? `Etiqueta guardada. Código de seguimiento de Correos detectado: ${code}.` : "Etiqueta guardada.";
    if (code) revalidatePath("/ventas", "layout");
  }
  return res;
}

/**
 * Ventas de Wallapop enviadas por Correos: al subir la etiqueta a mano se lee
 * el código de seguimiento y se guarda en la venta (como con las etiquetas de
 * Vinted que llegan por correo). Con otro transportista no se toca nada.
 */
async function codeFromWallapopLabel(saleId: string): Promise<string | null> {
  // Con la sesión del usuario: si no puede ver la venta, no se hace nada
  const supabase = await createClient();
  const { data: s } = await supabase
    .from("sales")
    .select("id, organization_id, tracking_number, shipping_label_path, carrier_id, platforms(name), carriers(name)")
    .eq("id", saleId)
    .maybeSingle<{ id: string; organization_id: string; tracking_number: string | null; shipping_label_path: string | null; carrier_id: string | null; platforms: { name: string } | null; carriers: { name: string } | null }>();
  if (!s?.shipping_label_path || s.tracking_number) return null;
  // Solo archivos de la carpeta de esta venta (el servidor lee con permisos amplios)
  if (!s.shipping_label_path.startsWith(`${s.id}/`)) return null;
  if (platformMark(s.platforms?.name)?.key !== "wallapop") return null;
  const carrierKey = carrierMark(s.carriers?.name)?.key ?? null;
  if (carrierKey && carrierKey !== "correos") return null;

  const admin = createAdminClient();
  const file = await admin.storage.from("shipping-labels").download(s.shipping_label_path);
  if (file.error || !file.data) return null;
  const buf = Buffer.from(await file.data.arrayBuffer());
  if (buf.length > 10 * 1024 * 1024) return null;
  const code = await readCorreosCode(buf, (file.data.type || "").toLowerCase());
  if (!code) return null;

  let carrierId = s.carrier_id;
  if (!carrierId) {
    const { data: cs } = await admin.from("carriers").select("id, name").eq("organization_id", s.organization_id).eq("active", true);
    carrierId = (cs ?? []).find((c) => carrierMark(c.name as string)?.key === "correos")?.id ?? null;
  }
  const { data: done } = await admin
    .from("sales")
    .update({ tracking_number: code, ...(s.carrier_id ? {} : carrierId ? { carrier_id: carrierId } : {}) })
    .eq("id", s.id)
    .eq("organization_id", s.organization_id)
    .is("tracking_number", null)
    .select("id");
  return done?.length ? code : null;
}

export async function setShippingStatusBulk(saleIds: string[], status: "pendiente" | "enviado"): Promise<ActionResult<number>> {
  const res = await callRpc<number>("set_sales_shipping_status", { p_sale_ids: saleIds, p_status: status }, ["/ventas", "/"]);
  if (res.ok && status === "enviado") {
    // El seguimiento empieza ya (la base de datos guarda la hora); si hay servicio de seguimiento, se da de alta el código
    after(() => runTracking({ saleIds }).catch(() => undefined));
  }
  if (res.ok) {
    const n = res.data;
    res.message =
      status === "enviado"
        ? `${n} ${n === 1 ? "venta marcada como enviada" : "ventas marcadas como enviadas"}. Seguimiento iniciado.`
        : `${n} ${n === 1 ? "venta marcada como pendiente" : "ventas marcadas como pendientes"}.`;
  }
  return res;
}

export async function updateSaleItem(patch: { id: string; unit_price?: number; notes?: string | null }): Promise<ActionResult> {
  return callRpc("update_sale_item", { p: patch }, ["/ventas"], "Línea actualizada.");
}

export async function voidSale(id: string, reason: string): Promise<ActionResult> {
  return callRpc("void_sale", { p_sale_id: id, p_reason: reason }, ["/ventas", "/"], "Venta anulada. Las unidades han vuelto a su lote.");
}

export async function quickCreateProduct(p: {
  name: string;
  brand_name?: string;
  category_name?: string;
  normal_sale_price?: string;
  variants?: { name: string }[];
}): Promise<ActionResult<string>> {
  return callRpc<string>("create_product", { p }, ["/productos"], "Producto creado. Recuerda: no tiene stock hasta que entre en una compra.");
}
