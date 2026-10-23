/**
 * Formatos de fechas, números y moneda en el idioma del usuario.
 * En el servidor se usa el idioma de la petición; en el navegador, el que
 * fija I18nProvider. En componentes del navegador es mejor useFormat().
 */
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { makeFormat, msg } from "@/i18n/translate";

function currentLocale(): Locale {
  if (typeof window !== "undefined") return (window as { __rsLocale?: Locale }).__rsLocale ?? DEFAULT_LOCALE;
  return (globalThis as { __rsServerLocale?: () => Locale }).__rsServerLocale?.() ?? DEFAULT_LOCALE;
}
const fmt = () => makeFormat(currentLocale());

export function money(v: number | string | null | undefined, opts?: { precise?: boolean }): string {
  return fmt().money(v, opts);
}

export function units(v: number | string | null | undefined): string {
  return fmt().units(v);
}

/** "1 ud." / "3 uds." */
export function udsLabel(v: number | string | null | undefined): string {
  return fmt().udsLabel(v);
}

export function percent(v: number | string | null | undefined): string {
  return fmt().percent(v);
}

/** Fecha corta. Las fechas sin hora se muestran tal cual; los instantes, en hora de Madrid. */
export function date(v: string | Date | null | undefined): string {
  return fmt().date(v);
}

export function dateTime(v: string | null | undefined): string {
  return fmt().dateTime(v);
}

export function monthLabel(ym: string): string {
  return fmt().monthLabel(ym);
}

/** Fecha de hoy en Madrid, "aaaa-mm-dd". */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

export const EXIT_REASONS: Record<string, string> = {
  regalo: msg("Regalo"),
  perdida: msg("Pérdida"),
  otro: msg("Otro"),
  pendiente: msg("Motivo pendiente"),
};

export const RETURN_TYPES: Record<string, string> = {
  devolucion_producto: msg("El cliente devuelve el producto"),
  reembolso_sin_producto: msg("Reembolso sin devolver el producto"),
};

export const PO_STATUS: Record<string, string> = { pendiente: msg("Pendiente"), recibido: msg("Recibido"), cancelado: msg("Cancelado") };

export const COST_TYPES: Record<string, string> = {
  transporte: msg("Transporte / porte"),
  aduanas: msg("Aduanas"),
  aranceles: msg("Aranceles"),
  comisiones: msg("Comisiones"),
  gestion: msg("Gestión"),
  otros: msg("Otros costes"),
};

export const MOVEMENT_TYPES: Record<string, string> = {
  entrada_compra: msg("Entrada por compra"),
  venta: msg("Venta"),
  anulacion_venta: msg("Venta anulada"),
  devolucion: msg("Devolución"),
  salida_sin_venta: msg("Salida sin venta"),
  anulacion_salida: msg("Salida anulada"),
  ajuste_entrada: msg("Ajuste (entrada)"),
  ajuste_salida: msg("Ajuste (salida)"),
};

/** Días completos que faltan hasta una fecha (0 si ya pasó). */
export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

/** ¿Pasaron al menos `days` días desde esa fecha? */
export function olderThanDays(iso: string | null | undefined, days: number): boolean {
  return !!iso && new Date(iso).getTime() < Date.now() - days * 86400000;
}
