import { describe, expect, it } from "vitest";
import { extractProductImage } from "@/lib/email/parse";

// Estructura como la del correo «¡Venta confirmada!» de Wallapop: avatar del comprador antes que la foto del artículo
const WALLAPOP = `
<table><tr><td><p>Comprado por:</p><p><b>Carlos A.</b></p></td>
<td><img src="https://cdn.wallapop.com/images/13/aa/bb/__/c13p1/i1111.jpg?pictureSize=W320" width="72" height="72" style="border-radius:50%"></td></tr></table>
<table><tr><td><img src="https://cdn.wallapop.com/images/10420/kx/aa/__/c10420p9999/i5555.jpg?pictureSize=W320" width="56" height="56"></td>
<td>Gafas de sol Oakley Holbrook</td><td>60.00€</td></tr></table>`;

describe("extractProductImage", () => {
  it("Wallapop: coge la foto junto al nombre del artículo, no el avatar del comprador", () => {
    expect(extractProductImage(WALLAPOP, "wallapop", "Gafas de sol Oakley Holbrook")).toContain("i5555.jpg");
  });
  it("sin el estilo redondo, también elige la más cercana al nombre", () => {
    const html = WALLAPOP.replace(' style="border-radius:50%"', "");
    expect(extractProductImage(html, "wallapop", "Gafas de sol Oakley Holbrook")).toContain("i5555.jpg");
  });
  it("Vinted sin nombre: la primera foto válida", () => {
    expect(extractProductImage(`<img src="https://images1.vinted.net/t/abc/f800/1.jpeg" width="200">`, "vinted")).toContain("images1.vinted.net");
  });
});
