import { msg } from "@/i18n/translate";
/**
 * Permisos de los miembros del equipo. El administrador los tiene todos;
 * a cada vendedor o mozo de almacén se le pueden dar o quitar áreas en
 * Equipo. La base de datos aplica las mismas reglas (no solo la pantalla).
 */
export type Perm =
  | "ventas_crear"
  | "ventas_todas"
  | "envios"
  | "ventas_editar"
  | "costes"
  | "catalogo"
  | "compras"
  | "stock"
  | "anuncios"
  | "correo"
  | "generador"
  | "importar"
  | "configuracion";

export const PERMISSIONS: { key: Perm; label: string; hint: string; group: "Ventas" | "Productos y almacén" | "Negocio" }[] = [
  { key: "ventas_crear", label: msg("Registrar ventas"), hint: msg("Crear ventas a su nombre."), group: "Ventas" },
  { key: "ventas_todas", label: msg("Ver todas las ventas"), hint: msg("No solo las suyas (necesario para preparar envíos de otros)."), group: "Ventas" },
  { key: "envios", label: msg("Gestionar envíos"), hint: msg("Marcar enviado, paquetería y etiqueta de las ventas que ve."), group: "Ventas" },
  { key: "ventas_editar", label: msg("Editar y anular ventas"), hint: msg("Cambiar cualquier dato, anular y registrar devoluciones."), group: "Ventas" },
  { key: "correo", label: msg("Ventas por correo"), hint: msg("Confirmar ventas detectadas y revisar correos de Vinted/Wallapop."), group: "Ventas" },
  { key: "catalogo", label: msg("Productos y fotos"), hint: msg("Crear y editar productos, variantes, fotos, marcas y categorías."), group: "Productos y almacén" },
  { key: "stock", label: msg("Salidas y ajustes de stock"), hint: msg("Regalos, pérdidas y correcciones de inventario."), group: "Productos y almacén" },
  { key: "compras", label: msg("Compras y proveedores"), hint: msg("Pedidos a proveedores, recepción y sus costes."), group: "Productos y almacén" },
  { key: "anuncios", label: msg("Anuncios"), hint: msg("Preparar anuncios y ver cuáles hay que quitar."), group: "Productos y almacén" },
  { key: "generador", label: msg("Generador de descripciones"), hint: msg("Usar la IA para escribir anuncios."), group: "Productos y almacén" },
  { key: "costes", label: msg("Costes, beneficios e informes"), hint: msg("Ver lo que costó cada lote, el beneficio, el panel de negocio, informes, reparto y exportar."), group: "Negocio" },
  { key: "importar", label: msg("Importar Excel"), hint: msg("Importar datos y resolver pendientes de revisar."), group: "Negocio" },
  { key: "configuracion", label: msg("Listas y responsables"), hint: msg("Plataformas, paqueterías, móviles, marcas, categorías y responsables."), group: "Negocio" },
];

export const ROLE_DEFAULTS: Record<"vendedor" | "almacen", Perm[]> = {
  vendedor: ["ventas_crear", "envios", "generador"],
  almacen: ["ventas_todas", "envios"],
};

/** ¿Puede este usuario hacer/ver esto? (el administrador, siempre) */
export function can(user: { role: string | null; permissions: string[] }, key: Perm): boolean {
  return user.role === "admin" || user.permissions.includes(key);
}
