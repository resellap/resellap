/**
 * Textos que se guardan ya montados en la base de datos (historial de
 * actividad, resúmenes de auditoría…) y se traducen al mostrarlos.
 * {0}, {1}… marcan los datos variables; si el dato es un texto conocido,
 * también se traduce.
 */
import { msg } from "./translate";

export const STORED_PATTERNS = [
  msg("Ajustes guardados: {0}"),
  msg("Restablecido: {0}"),
  msg("Restablecidos todos los ajustes personales"),
  msg("Sesión cerrada en todos los dispositivos"),
  msg("Descarga de mis datos"),
  msg("{0} exportado ({1}, {2} filas)"),
  msg("Copia comprobada: {0}"),
  msg("Copia de seguridad descargada ({0} tablas, {1} registros)"),
  msg("{0} · ya tiene etiqueta"),
  msg("Espacio creado: {0}"),
  msg("Gmail conectado ({0})"),
];
