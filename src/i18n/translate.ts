/**
 * Traductor: el texto original (español) es la clave.
 *   t("Nueva venta")                      → "New sale"
 *   t("{n} paquetes por enviar", { n: 3 }) → "3 parcels to ship"
 * Si falta una traducción se muestra el español (nunca un hueco).
 *
 * También traduce mensajes con datos variables que vienen ya montados (por
 * ejemplo, errores de la base de datos): en el diccionario se escriben con
 * {0}, {1}… en el lugar de cada dato y se reconocen por patrón.
 */
import { INTL_TAG, type Locale } from "./config";

export type Dict = Record<string, string>;
export type Vars = Record<string, string | number | null | undefined>;
export type T = ((text: string, vars?: Vars) => string) & { locale: Locale };

/** Marca un texto para traducir sin traducirlo todavía (constantes del módulo). */
export function msg<S extends string>(text: S): S {
  return text;
}

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k])));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type Pattern = { re: RegExp; to: string };
const patternCache = new WeakMap<Dict, Pattern[]>();

/** Claves con {0}, {1}… → expresiones para reconocer el mensaje ya montado. */
function patternsOf(dict: Dict): Pattern[] {
  let p = patternCache.get(dict);
  if (p) return p;
  p = [];
  for (const [k, v] of Object.entries(dict)) {
    if (!/\{\d\}/.test(k)) continue;
    const src = k.split(/\{\d\}/).map(escape).join("(.+?)");
    p.push({ re: new RegExp(`^${src}$`, "s"), to: v });
  }
  // Las claves más largas primero: son las más concretas
  p.sort((a, b) => b.re.source.length - a.re.source.length);
  patternCache.set(dict, p);
  return p;
}

export function makeT(locale: Locale, dict: Dict): T {
  const fn = ((text: string, vars?: Vars) => {
    if (!text) return text;
    if (locale === "es") return fill(text, vars);
    const hit = dict[text];
    if (hit !== undefined) return fill(hit, vars);
    if (vars === undefined) {
      for (const { re, to } of patternsOf(dict)) {
        const m = text.match(re);
        if (m)
          return to.replace(/\{(\d)\}/g, (_, i: string) => {
            // Si el dato es a su vez un texto conocido (p. ej. el nombre de una sección), también se traduce
            const v = m[Number(i) + 1] ?? "";
            return dict[v] ?? v;
          });
      }
    }
    return fill(text, vars);
  }) as T;
  fn.locale = locale;
  return fn;
}

// ---------------------------------------------------------------------
// Formatos (fechas, números, moneda) de cada idioma
// ---------------------------------------------------------------------
const UDS: Record<Locale, [string, string]> = {
  es: ["ud.", "uds."],
  en: ["unit", "units"],
  fr: ["unité", "unités"],
  de: ["Stk.", "Stk."],
  it: ["pz.", "pz."],
  pt: ["un.", "un."],
};
// ---------------------------------------------------------------------
type Num = number | string | null | undefined;
export type Formatter = {
  locale: Locale;
  tag: string;
  money(v: Num, opts?: { precise?: boolean }): string;
  units(v: Num): string;
  percent(v: Num): string;
  udsLabel(v: Num): string;
  date(v: string | Date | null | undefined): string;
  dateTime(v: string | null | undefined): string;
  /** «20 de octubre de 2026» */
  longDate(iso: string): string;
  monthLabel(ym: string): string;
  /** «12 oct · 14:30» */
  eventTime(iso: string): string;
};
const formatCache = new Map<Locale, Formatter>();

export function makeFormat(locale: Locale): Formatter {
  const hit = formatCache.get(locale);
  if (hit) return hit;
  const tag = INTL_TAG[locale];
  // Separador de miles siempre (1.284,50 €), también con 4 cifras
  const eur = new Intl.NumberFormat(tag, { style: "currency", currency: "EUR", useGrouping: "always" });
  const eur4 = new Intl.NumberFormat(tag, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 4, useGrouping: "always" });
  const int = new Intl.NumberFormat(tag, { maximumFractionDigits: 0, useGrouping: "always" });
  const pct = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
  const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" });
  const dateFmt = new Intl.DateTimeFormat(tag, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  const dateTimeFmt = new Intl.DateTimeFormat(tag, { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Madrid" });
  const monthFmt = new Intl.DateTimeFormat(tag, { month: "short", year: "2-digit", timeZone: "UTC" });
  const longFmt = new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const eventFmt = new Intl.DateTimeFormat(tag, { timeZone: "Europe/Madrid", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const isEmpty = (v: unknown) => v === null || v === undefined || v === "";
  const f: Formatter = {
    locale,
    tag,
    money(v: number | string | null | undefined, opts?: { precise?: boolean }): string {
      if (isEmpty(v)) return "—";
      const n = Number(v);
      if (!Number.isFinite(n)) return "—";
      return (opts?.precise ? eur4 : eur).format(n);
    },
    units(v: number | string | null | undefined): string {
      if (isEmpty(v)) return "—";
      return int.format(Number(v));
    },
    udsLabel(v: number | string | null | undefined): string {
      const n = Number(v ?? 0);
      const [one, many] = UDS[locale];
      return `${int.format(n)} ${n === 1 ? one : many}`;
    },
    percent(v: number | string | null | undefined): string {
      if (isEmpty(v)) return "—";
      const s = pct.format(Number(v));
      return locale === "en" ? `${s}%` : `${s} %`;
    },
    /** Fecha corta. Las fechas sin hora se muestran tal cual; los instantes, en hora de Madrid. */
    date(v: string | Date | null | undefined): string {
      if (!v) return "—";
      const s = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : dayOf.format(typeof v === "string" ? new Date(v) : v);
      return dateFmt.format(new Date(`${s.slice(0, 10)}T00:00:00Z`));
    },
    dateTime(v: string | null | undefined): string {
      if (!v) return "—";
      return dateTimeFmt.format(new Date(v));
    },
    longDate(iso: string): string {
      return longFmt.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
    },
    eventTime(iso: string): string {
      return eventFmt.format(new Date(iso)).replace(/,\s*/, " · ");
    },
    monthLabel(ym: string): string {
      const [y, m] = ym.split("-").map(Number);
      return monthFmt.format(new Date(Date.UTC(y, m - 1, 1)));
    },
  };
  formatCache.set(locale, f);
  return f;
}
