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
  msg("Pedido #{0}"),
  msg("Ajuste {0}"),
  // Resúmenes del historial de actividad y de la auditoría
  msg("Venta {0} registrada"),
  msg("Venta {0} anulada: {1}"),
  msg("Pedido de compra #{0} creado"),
  msg("Pedido de compra #{0} cancelado"),
  msg("Pedido de compra #{0} recibido ({1} unidades)"),
  msg("Costes del pedido #{0} actualizados"),
  msg("Devolución de la venta {0} (vuelve al stock)"),
  msg("Devolución de la venta {0} (reembolso sin producto)"),
  msg("Producto creado: {0}"),
  msg("Invitación enviada a {0} ({1})"),
  msg("Rol cambiado a {0}"),
  msg("Recibido en sustitución de {0}"),
  msg("Registrada automáticamente desde el correo de {0}"),
  msg("Ajuste de {0}: {1} x {2} · {3}"),
  msg("Salida sin venta ({0}): {1} x {2}"),
  msg("Importación de {0}: {1} productos, {2} pedidos, {3} ventas, {4} salidas sin venta"),
  // Palabras sueltas que llegan dentro de esos resúmenes
  msg("entrada"),
  msg("salida"),
  msg("regalo"),
  msg("perdida"),
  msg("otro"),
  msg("pendiente"),
  msg("admin"),
  msg("vendedor"),
  msg("almacen"),
];
