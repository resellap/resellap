"use client";
import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { makeFormat, makeT, type Dict, type Formatter, type T } from "./translate";

type Ctx = { t: T; f: Formatter };
const I18n = createContext<Ctx>({ t: makeT(DEFAULT_LOCALE, {}), f: makeFormat(DEFAULT_LOCALE) });

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  const value = useMemo(() => ({ t: makeT(locale, dict), f: makeFormat(locale) }), [locale, dict]);
  // Para las funciones de formato llamadas fuera de un componente (en el navegador)
  if (typeof window !== "undefined") (window as { __rsLocale?: Locale }).__rsLocale = locale;
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

/** Traductor en componentes del navegador. */
export function useT(): T {
  return useContext(I18n).t;
}

/** Fechas, números y moneda en el idioma del usuario. */
export function useFormat(): Formatter {
  return useContext(I18n).f;
}
