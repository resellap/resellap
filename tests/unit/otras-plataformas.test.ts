import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { classify } from "@/lib/email/parse";
import { toAiResult } from "@/lib/email/ai-sale";

describe("classify · otras plataformas", () => {
  it("eBay: venta → otra_venta", () => {
    expect(classify({ from: "eBay <ebay@ebay.es>", subject: "¡Has vendido tu artículo! Gafas Oakley Holbrook", text: "Envía el artículo al comprador", pdfNames: [] })).toEqual({ kind: "otra_venta", platform: "ebay" });
  });
  it("eBay: publicidad → otro", () => {
    expect(classify({ from: "eBay <ebay@ebay.es>", subject: "Ofertas de la semana", text: "Descubre las mejores ofertas", pdfNames: [] })).toEqual({ kind: "otro", platform: "ebay" });
  });
  it("Milanuncios: venta → otra_venta", () => {
    expect(classify({ from: "Milanuncios <no-reply@milanuncios.com>", subject: "Tu venta se ha completado", text: "El comprador ha pagado", pdfNames: [] }).kind).toBe("otra_venta");
  });
  it("Facebook: solo si habla de Marketplace", () => {
    expect(classify({ from: "Facebook <notification@facebookmail.com>", subject: "Marketplace: has vendido tu artículo", text: "Pedido 123", pdfNames: [] })).toEqual({ kind: "otra_venta", platform: "facebook" });
    expect(classify({ from: "Facebook <notification@facebookmail.com>", subject: "Tienes 3 notificaciones", text: "Ana ha comentado tu foto", pdfNames: [] }).platform).toBeNull();
  });
  it("Vinted y Wallapop siguen igual", () => {
    expect(classify({ from: "Vinted <no-reply@vinted.es>", subject: "Has vendido un artículo en Vinted", text: "Hola, Mauri: Ana ha comprado", pdfNames: [] }).kind).toBe("vinted_venta");
  });
});

describe("toAiResult", () => {
  const now = new Date("2026-10-21T10:00:00Z");
  it("venta con datos completos", () => {
    const r = toAiResult({ es_venta: true, producto: "Gafas Oakley Holbrook", precio: 60, envio: 4.5, total: 64.5, comprador: "carlos_a", fecha: "2026-10-21", pedido: "12-34567-89" }, now);
    expect(r.kind).toBe("sale");
    if (r.kind === "sale") {
      expect(r.sale.price).toBe(60);
      expect(r.sale.order_id).toBe("12-34567-89");
      expect(r.sale.doubt).toContain("Leída con IA");
      expect(r.sale.doubt).not.toContain("no cuadran");
    }
  });
  it("no es venta (compra propia)", () => {
    expect(toAiResult({ es_venta: false, motivo: "Es una compra del usuario" }, now)).toEqual({ kind: "not_sale", reason: "Es una compra del usuario" });
  });
  it("sin precio no se crea", () => {
    expect(toAiResult({ es_venta: true, producto: "Algo" }, now).kind).toBe("not_sale");
  });
  it("importes que no cuadran y fecha absurda", () => {
    const r = toAiResult({ es_venta: true, producto: "Levi's 501", precio: 30, envio: 3, total: 40, fecha: "2019-01-01" }, now);
    if (r.kind !== "sale") throw new Error("debería ser venta");
    expect(r.sale.doubt).toContain("no cuadran");
    expect(r.sale.sale_date).toBeNull();
  });
});
