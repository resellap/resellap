/**
 * Idiomas de Resellap. El texto original está en español; los demás idiomas
 * son diccionarios «texto en español → traducción» (messages/<idioma>.json).
 */
export const LOCALES = ["es", "en", "fr", "de", "it", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

/** Nombre de cada idioma en su propio idioma (para el selector). */
export const LOCALE_NAMES: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};

/** Formato regional de cada idioma (fechas, números y moneda). */
export const INTL_TAG: Record<Locale, string> = {
  es: "es-ES",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
};

/**
 * Idiomas que ya se pueden elegir (con la traducción completa). Los demás
 * existen en el código pero no se ofrecen hasta terminar su traducción.
 */
export const ENABLED_LOCALES: readonly Locale[] = ["es", "en", "fr", "de", "it", "pt"];

export const LOCALE_COOKIE = "rs-idioma";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (ENABLED_LOCALES as readonly string[]).includes(v);
}

/** Primer idioma admitido de una cabecera Accept-Language («fr-FR,fr;q=0.9,en;q=0.8»). */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  const wanted = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((x) => x.lang)
    .sort((a, b) => b.q - a.q);
  for (const w of wanted) if (isLocale(w.lang)) return w.lang;
  return DEFAULT_LOCALE;
}
