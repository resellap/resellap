import { tSync } from "@/i18n/server";
import { msg } from "@/i18n/translate";
/**
 * Definición de los informes: qué columnas tiene cada uno. La misma
 * definición se usa para la pantalla y para exportar a Excel/CSV, así
 * lo exportado es exactamente lo que se ve (con los mismos filtros).
 */
import { EXIT_REASONS, PO_STATUS } from "./format";

export type ColumnKind = "text" | "date" | "int" | "money" | "money4" | "pct";
/** tr: el valor es un texto de la app (estado, motivo…) y se traduce al exportar. */
export type Column = { key: string; label: string; kind: ColumnKind; value: (row: Record<string, unknown>) => unknown; tr?: true };

const v = (k: string) => (r: Record<string, unknown>) => r[k];
const variant = (r: Record<string, unknown>) => (r.variant_name === "Única" || r.variant_name === "Sin especificar" ? "" : r.variant_name);

export type ReportType = "ventas" | "inventario" | "compras" | "responsables" | "salidas";

export const REPORTS: Record<ReportType, { title: string; rpc: string; columns: Column[]; fileName: string }> = {
  ventas: {
    title: msg("Informe de ventas"),
    rpc: "report_sale_lines",
    fileName: "ventas",
    columns: [
      { key: "sale_date", label: msg("Fecha"), kind: "date", value: v("sale_date") },
      { key: "sale_number", label: msg("Nº venta"), kind: "text", value: v("sale_number") },
      { key: "responsible_name", label: msg("Responsable"), kind: "text", value: v("responsible_name") },
      { key: "product_name", label: msg("Producto"), kind: "text", value: v("product_name") },
      { key: "variant_name", label: msg("Variante"), kind: "text", value: variant },
      { key: "category_name", label: msg("Categoría"), kind: "text", value: v("category_name") },
      { key: "net_quantity", label: msg("Unidades"), kind: "int", value: v("net_quantity") },
      { key: "unit_price", label: msg("Precio"), kind: "money", value: v("unit_price") },
      { key: "net_amount", label: msg("Importe"), kind: "money", value: v("net_amount") },
      { key: "cost_amount", label: msg("Coste"), kind: "money", value: v("cost_amount") },
      { key: "profit", label: msg("Beneficio"), kind: "money", value: v("profit") },
      { key: "platform_name", label: msg("Plataforma"), kind: "text", value: v("platform_name") },
      { key: "purchase_order_number", label: msg("Pedido"), kind: "int", value: v("purchase_order_number") },
      { key: "lot_label", label: msg("Lote"), kind: "text", tr: true, value: v("lot_label") },
      { key: "refunded_amount", label: msg("Reembolsado"), kind: "money", value: v("refunded_amount") },
      { key: "line_notes", label: msg("Detalle"), kind: "text", value: v("line_notes") },
    ],
  },
  inventario: {
    title: msg("Informe de inventario"),
    rpc: "report_inventory",
    fileName: "inventario",
    columns: [
      { key: "product_name", label: msg("Producto"), kind: "text", value: v("product_name") },
      { key: "variant_name", label: msg("Variante"), kind: "text", value: variant },
      { key: "sku", label: msg("SKU"), kind: "text", value: v("sku") },
      { key: "category_name", label: msg("Categoría"), kind: "text", value: v("category_name") },
      { key: "brand_name", label: msg("Marca"), kind: "text", value: v("brand_name") },
      { key: "stock", label: msg("Stock"), kind: "int", value: v("stock") },
      { key: "weighted_avg_cost", label: msg("Coste medio ponderado"), kind: "money4", value: v("weighted_avg_cost") },
      { key: "stock_value", label: msg("Valor almacén"), kind: "money", value: v("stock_value") },
      { key: "potential_unit_price", label: msg("Precio venta"), kind: "money", value: v("potential_unit_price") },
      { key: "potential_is_estimated", label: msg("Precio estimado (precio medio)"), kind: "text", tr: true, value: (r) => (r.potential_is_estimated ? msg("Sí") : "") },
      { key: "potential_value", label: msg("Valor potencial"), kind: "money", value: v("potential_value") },
      { key: "potential_profit", label: msg("Beneficio potencial"), kind: "money", value: v("potential_profit") },
      { key: "units_sold", label: msg("Unidades vendidas"), kind: "int", value: v("units_sold") },
      { key: "lot_labels", label: msg("Lotes con stock"), kind: "text", value: (r) => (Array.isArray(r.lot_labels) ? (r.lot_labels as string[]).map((l) => tSync()(l)).join(", ") : "") },
    ],
  },
  compras: {
    title: msg("Informe de compras"),
    rpc: "report_purchase_lines",
    fileName: "compras",
    columns: [
      { key: "order_number", label: msg("Pedido"), kind: "int", value: v("order_number") },
      { key: "order_date", label: msg("Fecha"), kind: "date", value: v("order_date") },
      { key: "po_status", label: msg("Estado"), kind: "text", tr: true, value: (r) => PO_STATUS[String(r.po_status)] ?? r.po_status },
      { key: "supplier_name", label: msg("Proveedor"), kind: "text", value: v("supplier_name") },
      { key: "product_name", label: msg("Producto"), kind: "text", value: v("product_name") },
      { key: "variant_name", label: msg("Variante"), kind: "text", value: variant },
      { key: "qty_basis", label: msg("Unidades"), kind: "int", value: v("qty_basis") },
      { key: "unit_cost", label: msg("Coste unitario"), kind: "money4", value: v("unit_cost") },
      { key: "merchandise_cost", label: msg("Coste mercancía"), kind: "money", value: v("merchandise_cost") },
      { key: "transporte", label: msg("Transporte"), kind: "money", value: v("transporte") },
      { key: "aduanas", label: msg("Aduanas"), kind: "money", value: v("aduanas") },
      { key: "aranceles", label: msg("Aranceles"), kind: "money", value: v("aranceles") },
      { key: "comisiones", label: msg("Comisiones"), kind: "money", value: v("comisiones") },
      { key: "gestion", label: msg("Gestión"), kind: "money", value: v("gestion") },
      { key: "otros", label: msg("Otros costes"), kind: "money", value: v("otros") },
      { key: "real_unit_cost", label: msg("Coste real unitario"), kind: "money4", value: v("real_unit_cost") },
      { key: "real_total_cost", label: msg("Coste real total"), kind: "money", value: v("real_total_cost") },
    ],
  },
  responsables: {
    title: msg("Informe de responsables"),
    rpc: "report_responsibles",
    fileName: "responsables",
    columns: [
      { key: "ranking", label: msg("Ranking"), kind: "int", value: v("ranking") },
      { key: "responsible_name", label: msg("Responsable"), kind: "text", value: v("responsible_name") },
      { key: "units", label: msg("Unidades"), kind: "int", value: v("units") },
      { key: "orders", label: msg("Pedidos"), kind: "int", value: v("orders") },
      { key: "revenue", label: msg("Facturación"), kind: "money", value: v("revenue") },
      { key: "avg_ticket", label: msg("Ticket medio"), kind: "money", value: v("avg_ticket") },
      { key: "revenue_pct", label: msg("% de las ventas"), kind: "pct", value: v("revenue_pct") },
      { key: "profit", label: msg("Beneficio"), kind: "money", value: v("profit") },
    ],
  },
  salidas: {
    title: msg("Salidas sin venta"),
    rpc: "",
    fileName: "salidas-sin-venta",
    columns: [
      { key: "exit_date", label: msg("Fecha"), kind: "date", value: v("exit_date") },
      { key: "product_name", label: msg("Producto"), kind: "text", value: v("product_name") },
      { key: "variant_name", label: msg("Variante"), kind: "text", value: variant },
      { key: "lot_label", label: msg("Lote"), kind: "text", tr: true, value: v("lot_label") },
      { key: "quantity", label: msg("Unidades"), kind: "int", value: v("quantity") },
      { key: "cost_amount", label: msg("Coste perdido"), kind: "money", value: v("cost_amount") },
      { key: "reason", label: msg("Motivo"), kind: "text", tr: true, value: (r) => EXIT_REASONS[String(r.reason)] ?? r.reason },
      { key: "responsible_name", label: msg("Responsable"), kind: "text", value: v("responsible_name") },
      { key: "notes", label: msg("Notas"), kind: "text", value: v("notes") },
    ],
  },
};
