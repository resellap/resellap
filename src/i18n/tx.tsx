"use client";
import { useT } from "./client";
import type { Vars } from "./translate";

/**
 * Texto traducido para componentes que se usan tanto en el servidor como en
 * el navegador (ui.tsx): se traduce con el idioma del proveedor.
 */
export function Tx({ children, vars }: { children: string; vars?: Vars }) {
  return <>{useT()(children, vars)}</>;
}
