import { msg } from "@/i18n/translate";
/**
 * Qué tipos de hoja sabe importar Resellap y qué campos tiene cada uno.
 * Los "sinónimos" sirven para relacionar automáticamente las columnas del
 * Excel con los campos, aunque los nombres no coincidan exactamente.
 * El administrador siempre puede cambiar la relación a mano.
 */

export type SheetType = "productos" | "compras" | "ventas" | "moviles" | "responsables" | "ignorar";

export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  /** Solo se usa para comprobar que los datos cuadran; no se importa. */
  verifyOnly?: boolean;
  help?: string;
  synonyms: string[];
};

export const SHEET_TYPES: { type: SheetType; label: string; description: string; nameHints: string[] }[] = [
  {
    type: "productos",
    label: msg("Productos / catálogo"),
    description: msg("Un producto por fila: nombre, categoría, descripción…"),
    nameHints: ["almacen", "productos", "catalogo", "articulos", "inventario"],
  },
  {
    type: "compras",
    label: msg("Compras (líneas de pedidos de compra)"),
    description: msg("Una fila por producto comprado, con su número de pedido, unidades y coste."),
    nameHints: ["gastos", "compras", "pedidos", "proveedores"],
  },
  {
    type: "ventas",
    label: msg("Ventas"),
    description: msg("Una fila por producto vendido, con fecha, responsable y pedido de procedencia."),
    nameHints: ["ventas", "venta"],
  },
  {
    type: "moviles",
    label: msg("Móviles"),
    description: msg("Los móviles desde los que se vende."),
    nameHints: ["moviles", "movil"],
  },
  {
    type: "responsables",
    label: msg("Responsables (socios del reparto)"),
    description: msg("Los responsables que aparecen aquí se marcan como socios del reparto 50/50."),
    nameHints: ["responsables"],
  },
  {
    type: "ignorar",
    label: msg("No importar"),
    description: msg("Hojas de cálculos, resúmenes o vacías."),
    nameHints: [],
  },
];

export const FIELDS: Record<Exclude<SheetType, "ignorar">, FieldDef[]> = {
  productos: [
    { key: "name", label: msg("Nombre del producto"), required: true, synonyms: ["nombre", "producto", "articulo", "nombre producto", "nombre del producto"] },
    { key: "description", label: msg("Descripción"), synonyms: ["descripcion", "detalle", "detalles"] },
    { key: "category", label: msg("Categoría"), synonyms: ["categoria", "familia", "tipo"] },
    { key: "brand", label: msg("Marca"), help: msg("Si no hay columna de marca, se deduce de nombres tipo «Marca - Modelo»."), synonyms: ["marca"] },
    { key: "sku", label: msg("SKU / referencia"), synonyms: ["sku", "referencia", "ref", "codigo", "ean"] },
    { key: "normal_sale_price", label: msg("Precio normal de venta"), synonyms: ["precio venta", "precio de venta", "pvp", "precio normal", "precio normal de venta"] },
    { key: "legacy_code", label: msg("ID antiguo (solo referencia)"), synonyms: ["id producto", "id", "codigo interno"] },
    { key: "expected_stock", label: msg("Stock actual (para comprobar)"), verifyOnly: true, synonyms: ["stock actual", "stock"] },
  ],
  compras: [
    { key: "order_number", label: msg("Nº de pedido de compra"), required: true, synonyms: ["referencia pedido", "refencia pedido", "n pedido", "num pedido", "numero pedido", "numero de pedido", "pedido"] },
    { key: "order_date", label: msg("Fecha"), required: true, synonyms: ["fecha", "fecha pedido", "fecha compra"] },
    { key: "product_name", label: msg("Producto"), required: true, synonyms: ["articulo", "producto", "nombre"] },
    { key: "quantity", label: msg("Unidades"), required: true, synonyms: ["unidades", "cantidad", "uds"] },
    { key: "unit_cost", label: msg("Coste unitario (mercancía)"), required: true, synonyms: ["coste unitario", "coste", "precio compra", "coste unidad", "precio unitario"] },
    { key: "supplier", label: msg("Proveedor"), synonyms: ["proveedor"] },
    { key: "notes", label: msg("Descripción / notas"), synonyms: ["descripcion", "notas", "observaciones"] },
    { key: "transporte", label: msg("Transporte / gastos de envío (del pedido)"), help: msg("Importe total del pedido; basta con ponerlo en una de sus filas."), synonyms: ["gastos de envio", "envio", "transporte", "porte", "portes"] },
    { key: "aduanas", label: msg("Aduanas (del pedido)"), synonyms: ["aduanas", "aduana"] },
    { key: "aranceles", label: msg("Aranceles (del pedido)"), synonyms: ["aranceles", "arancel"] },
    { key: "comisiones", label: msg("Comisiones (del pedido)"), synonyms: ["comisiones", "comision"] },
    { key: "gestion", label: msg("Gestión (del pedido)"), synonyms: ["gestion"] },
    { key: "otros", label: msg("Otros costes (del pedido)"), synonyms: ["otros costes", "otros"] },
    { key: "expected_real_unit_cost", label: msg("Coste unitario real (para comprobar)"), verifyOnly: true, synonyms: ["coste unitario neto", "coste real", "coste real unitario"] },
  ],
  ventas: [
    { key: "sale_date", label: msg("Fecha"), required: true, synonyms: ["fecha", "fecha venta"] },
    { key: "responsible", label: msg("Responsable"), required: true, synonyms: ["responsable", "vendedor"] },
    { key: "product_name", label: msg("Producto"), required: true, synonyms: ["producto", "articulo", "nombre"] },
    { key: "quantity", label: msg("Unidades"), required: true, synonyms: ["cantidad vendida", "cantidad", "unidades", "uds"] },
    { key: "total_price", label: msg("Importe total de la línea"), help: msg("Si existe, manda sobre el precio unitario."), synonyms: ["precio total", "importe", "total", "importe total"] },
    { key: "unit_price", label: msg("Precio unitario"), synonyms: ["precio unitario", "precio"] },
    { key: "purchase_order_number", label: msg("Pedido / lote de procedencia"), synonyms: ["referencia pedido", "pedido", "n pedido", "lote", "pedido de procedencia"] },
    { key: "shipping_method", label: msg("Método de envío («Plataforma - Transportista»)"), synonyms: ["metodo de envio", "metodo envio", "envio"] },
    { key: "platform", label: msg("Plataforma"), synonyms: ["aplicacion", "plataforma", "app"] },
    { key: "carrier", label: msg("Empresa de transporte"), synonyms: ["por donde se envia", "transportista", "empresa de transporte"] },
    { key: "shipped", label: msg("Enviado (sí/no)"), synonyms: ["enviado", "estado envio"] },
    { key: "mobile", label: msg("Móvil utilizado (número)"), synonyms: ["movil", "movil utilizado"] },
    { key: "notes", label: msg("Detalles / notas"), synonyms: ["detalles del producto", "detalles", "notas", "observaciones"] },
    { key: "external_reference", label: msg("Referencia de la venta"), synonyms: ["referencia venta", "n venta", "numero venta"] },
  ],
  moviles: [
    { key: "number", label: msg("Número de móvil"), required: true, synonyms: ["n", "num", "numero movil", "id"] },
    { key: "name", label: msg("Nombre del móvil"), required: true, synonyms: ["movil", "nombre", "modelo"] },
    { key: "email", label: msg("Correo de la cuenta"), synonyms: ["correo", "email", "mail"] },
    { key: "phone", label: msg("Teléfono"), synonyms: ["numero", "telefono", "tlf"] },
  ],
  responsables: [{ key: "name", label: msg("Responsable"), required: true, synonyms: ["responsable", "nombre", "vendedor"] }],
};

/**
 * Encabezados habituales en inglés, francés, alemán, italiano y portugués
 * (sin tildes y en minúsculas, como se comparan): así un Excel en otro
 * idioma también se relaciona solo.
 */
const MORE_SYNONYMS: Partial<Record<Exclude<SheetType, "ignorar">, Record<string, string[]>>> = {
  productos: {
    name: ["product", "product name", "name", "item", "nom", "nom du produit", "produit", "article", "produkt", "produktname", "artikel", "bezeichnung", "prodotto", "nome", "nome prodotto", "articolo", "produto", "nome do produto", "artigo"],
    description: ["description", "beschreibung", "descrizione", "descricao"],
    category: ["category", "categorie", "kategorie", "categoria"],
    brand: ["brand", "marque", "marke", "marchio", "marca"],
    sku: ["sku", "reference", "code", "artikelnummer", "codice", "codigo"],
    normal_sale_price: ["price", "sale price", "selling price", "prix", "prix de vente", "preis", "verkaufspreis", "prezzo", "prezzo di vendita", "preco", "preco de venda"],
    expected_stock: ["stock", "quantity in stock", "bestand", "giacenza", "estoque"],
  },
  compras: {
    order_number: ["order", "order number", "purchase order", "po", "commande", "numero de commande", "bestellung", "bestellnummer", "ordine", "numero ordine", "encomenda", "numero da encomenda"],
    order_date: ["date", "order date", "purchase date", "date de commande", "datum", "bestelldatum", "data", "data ordine", "data da encomenda"],
    product_name: ["product", "item", "produit", "article", "produkt", "artikel", "prodotto", "articolo", "produto", "artigo"],
    quantity: ["quantity", "qty", "units", "quantite", "menge", "anzahl", "stuck", "quantita", "pezzi", "quantidade", "unidades"],
    unit_cost: ["unit cost", "cost", "purchase price", "cout unitaire", "prix d achat", "stuckpreis", "einkaufspreis", "costo unitario", "prezzo di acquisto", "custo unitario", "preco de compra"],
    supplier: ["supplier", "vendor", "fournisseur", "lieferant", "fornitore", "fornecedor"],
    notes: ["notes", "remarques", "notizen", "note", "observacoes"],
    transporte: ["shipping", "delivery", "freight", "frais de port", "livraison", "versand", "versandkosten", "spedizione", "trasporto", "portes", "envio"],
    aduanas: ["customs", "douane", "zoll", "dogana", "alfandega"],
    aranceles: ["duties", "tariffs", "droits de douane", "zollgebuhren", "dazi", "direitos aduaneiros"],
    comisiones: ["fees", "commission", "commissions", "gebuhren", "provision", "commissioni", "comissoes"],
  },
  ventas: {
    sale_date: ["date", "sale date", "date de vente", "datum", "verkaufsdatum", "data", "data vendita", "data da venda"],
    responsible: ["seller", "salesperson", "vendeur", "verkaufer", "venditore", "vendedor"],
    product_name: ["product", "item", "produit", "article", "produkt", "artikel", "prodotto", "articolo", "produto", "artigo"],
    quantity: ["quantity", "qty", "units", "quantite", "menge", "anzahl", "quantita", "quantidade"],
    total_price: ["total", "amount", "total price", "montant", "prix total", "betrag", "gesamtpreis", "importo", "totale", "valor total", "montante"],
    unit_price: ["unit price", "price", "prix unitaire", "prix", "einzelpreis", "preis", "prezzo unitario", "prezzo", "preco unitario", "preco"],
    purchase_order_number: ["batch", "lot", "order", "purchase order", "lot d origine", "charge", "lotto", "ordine", "lote"],
    platform: ["platform", "marketplace", "plateforme", "plattform", "piattaforma", "plataforma"],
    carrier: ["carrier", "courier", "transporteur", "versanddienstleister", "spediziere", "corriere", "transportadora"],
    shipped: ["shipped", "expedie", "envoye", "versendet", "spedito", "enviado"],
    notes: ["notes", "remarques", "notizen", "note", "observacoes"],
    external_reference: ["reference", "order id", "transaction", "referenz", "riferimento", "referencia"],
  },
  responsables: { name: ["seller", "name", "vendeur", "nom", "verkaufer", "venditore", "nome"] },
};
for (const [type, fields] of Object.entries(MORE_SYNONYMS) as [Exclude<SheetType, "ignorar">, Record<string, string[]>][]) {
  for (const f of FIELDS[type]) {
    const extra = fields[f.key];
    if (extra) f.synonyms = [...f.synonyms, ...extra.filter((x) => !f.synonyms.includes(x))];
  }
}

export function fieldsFor(type: SheetType): FieldDef[] {
  return type === "ignorar" ? [] : FIELDS[type];
}
