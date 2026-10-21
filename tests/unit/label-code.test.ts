import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { correosCodeFrom } from "@/lib/tracking/label-code";

describe("correosCodeFrom (etiqueta de Wallapop por Correos)", () => {
  it("lee el código nacional PQ… de 23 caracteres", () => {
    expect(correosCodeFrom("CORREOS\nDestinatario: Ana\nPQ4F6P0712345670128001X\n46001 Valencia")).toBe("PQ4F6P0712345670128001X");
  });
  it("lee el formato internacional (2 letras + 9 cifras + ES)", () => {
    expect(correosCodeFrom("Envío: CD123456789ES")).toBe("CD123456789ES");
  });
  it("no confunde códigos de otros transportistas", () => {
    expect(correosCodeFrom("InPost 36923576 · UPS 1Z999AA10123456784")).toBeNull();
  });
});
