"use client";
import { useFormat } from "./client";

/** Fecha, número o importe con el formato del idioma (para componentes compartidos). */
export function Fmt({ kind, value }: { kind: "money" | "units" | "percent" | "date" | "dateTime" | "udsLabel" | "eventTime"; value: number | string | null | undefined }) {
  const f = useFormat();
  if (value === null || value === undefined) return <>—</>;
  return <>{(f[kind] as (v: string | number) => string)(value)}</>;
}
