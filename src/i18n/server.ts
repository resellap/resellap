import "server-only";
/**
 * Idioma en el servidor. Se decide una vez por petición:
 *   1. la cookie del idioma (se guarda al elegirlo en Ajustes o en el login),
 *   2. el idioma guardado en las preferencias del usuario (otro dispositivo),
 *   3. el idioma del navegador,
 *   4. español.
 */
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, pickLocale, type Locale } from "./config";
import { makeFormat, makeT, type Dict, type T } from "./translate";

const store = cache(() => ({ locale: null as Locale | null }));

// format.ts (compartido con el navegador) pregunta aquí el idioma de la petición en curso
(globalThis as { __rsServerLocale?: () => Locale }).__rsServerLocale = () => {
  try {
    return store().locale ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

export const getLocale = cache(async (): Promise<Locale> => {
  const s = store();
  if (s.locale) return s.locale;
  let l: Locale | null = null;
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) l = fromCookie;
  if (!l) {
    try {
      const { loadStoredPrefs } = await import("@/lib/user-prefs");
      const saved = (await loadStoredPrefs()).language;
      if (isLocale(saved)) l = saved;
    } catch {
      // sin sesión o sin base de datos: se sigue con el navegador
    }
  }
  if (!l) l = pickLocale((await headers()).get("accept-language"));
  s.locale = l;
  return l;
});

import de from "./messages/de.json";
import en from "./messages/en.json";
import fr from "./messages/fr.json";
import it from "./messages/it.json";
import pt from "./messages/pt.json";

const DICTS: Record<Locale, Dict> = { es: {}, en, fr, de, it, pt };

export async function loadDict(locale: Locale): Promise<Dict> {
  return DICTS[locale];
}

/**
 * Traductor síncrono para componentes del servidor que no pueden esperar.
 * Usa el idioma que ya ha fijado la página (getT/getLocale) en esta petición.
 */
export function tSync(): T {
  const l = store().locale ?? DEFAULT_LOCALE;
  return makeT(l, DICTS[l]);
}

export const getT = cache(async (): Promise<T> => {
  const l = await getLocale();
  return makeT(l, await loadDict(l));
});

export const getFormat = cache(async () => makeFormat(await getLocale()));

/** Traductor de un idioma concreto (correos a otra persona, tareas sin petición). */
export async function tFor(locale: Locale): Promise<T> {
  return makeT(locale, await loadDict(locale));
}
