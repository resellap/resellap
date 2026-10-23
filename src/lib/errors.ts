import { msg } from "@/i18n/translate";
/**
 * Convierte los errores de Supabase/PostgreSQL en mensajes claros.
 * Los errores de las funciones de negocio ya vienen en español.
 */
type PgError = { message?: string; code?: string; details?: string | null; hint?: string | null } | null | undefined;

const CONSTRAINTS: Record<string, string> = {
  products_name_uq: msg("Ya existe un producto con ese nombre."),
  products_sku_uq: msg("Ese SKU ya está en uso."),
  product_variants_sku_uq: msg("Ese SKU ya está en uso."),
  product_variants_name_uq: msg("Ese producto ya tiene una variante con ese nombre."),
  responsibles_name_uq: msg("Ya existe un responsable con ese nombre."),
  suppliers_name_uq: msg("Ya existe un proveedor con ese nombre."),
  brands_name_uq: msg("Ya existe una marca con ese nombre."),
  categories_name_uq: msg("Ya existe una categoría con ese nombre."),
  platforms_name_uq: msg("Ya existe una plataforma con ese nombre."),
  carriers_name_uq: msg("Ya existe una empresa de transporte con ese nombre."),
  mobile_devices_number_key: msg("Ya existe un móvil con ese número."),
  purchase_orders_order_number_key: msg("Ya existe un pedido de compra con ese número."),
  responsibles_profile_id_key: msg("Ese usuario ya está vinculado a otro responsable."),
  inventory_lots_stock_no_negativo: msg("No hay stock suficiente."),
  sales_label_path_own_folder: msg("La etiqueta no corresponde a esta venta."),
  sales_image_path_own_org: msg("La foto no corresponde a este espacio."),
};

// Errores de negocio que lanzan nuestras funciones (mensajes ya pensados para el usuario)
const OWN_CODES = new Set(["P0001", "MI001"]);

export function friendlyError(e: PgError): string {
  if (!e) return msg("Ha ocurrido un error.");
  const text = e.message ?? "";
  for (const [name, message] of Object.entries(CONSTRAINTS)) if (text.includes(name)) return message;
  if (e.code === "42501" && !/[áéíóúñ]/i.test(text)) return msg("No tienes permisos para realizar esta acción.");
  if (e.code === "23505") return msg("Ya existe un registro con esos datos.");
  if (e.code === "23503") return msg("No se puede completar: hay datos relacionados que lo impiden.");
  if (/fetch failed|Failed to fetch|NetworkError/i.test(text)) return msg("No se puede conectar con la base de datos. Revisa tu conexión.");
  if (/JWT|session/i.test(text)) return msg("Tu sesión ha caducado. Vuelve a iniciar sesión.");
  if (e.code === "23514" || e.code === "22P02" || e.code === "22003") return msg("Los datos no son válidos.");
  // Cualquier otro error interno de la base de datos (con código SQL y sin
  // mensaje en español) no se enseña tal cual: podría revelar detalles internos
  if (e.code && !OWN_CODES.has(e.code) && !/[áéíóúñ¿¡]/i.test(text)) return msg("Ha ocurrido un error. Inténtalo de nuevo.");
  return text || msg("Ha ocurrido un error.");
}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };
