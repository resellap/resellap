import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { pickSale } from "@/lib/email/photo-backfill";

const day = (s: string) => Date.parse(s + "T00:00:00Z");
const sale = (id: string, platform: "vinted" | "wallapop", date: string, amount: number, name: string) => ({ id, platform, date: day(date), amount, names: [name] });

describe("pickSale (foto de ventas anteriores)", () => {
  it("elige la única venta con mismo precio, plataforma y fecha cercana", () => {
    const c = [sale("a", "wallapop", "2026-10-12", 60, "Gafas de sol Oakley Holbrook"), sale("b", "vinted", "2026-10-12", 60, "Gafas de sol Oakley Holbrook")];
    expect(pickSale(c, { platform: "wallapop", day: day("2026-10-13"), price: 60, product: "Gafas de sol Oakley Holbrook" })?.id).toBe("a");
  });
  it("no elige si el precio o la fecha no cuadran", () => {
    const c = [sale("a", "wallapop", "2026-10-01", 60, "Gafas Oakley")];
    expect(pickSale(c, { platform: "wallapop", day: day("2026-10-12"), price: 60, product: "Gafas Oakley" })).toBeNull();
    expect(pickSale(c, { platform: "wallapop", day: day("2026-10-01"), price: 55, product: "Gafas Oakley" })).toBeNull();
  });
  it("con una sola candidata, exige que el nombre se parezca", () => {
    const c = [sale("a", "vinted", "2026-10-10", 30, "Levi's 501 talla 32")];
    expect(pickSale(c, { platform: "vinted", day: day("2026-10-10"), price: 30, product: "Gorra New Era" })).toBeNull();
    expect(pickSale(c, { platform: "vinted", day: day("2026-10-10"), price: 30, product: "Pantalón Levi's 501" })?.id).toBe("a");
  });
  it("con varias del mismo precio, solo si el nombre deja clara una", () => {
    const c = [sale("a", "vinted", "2026-10-10", 15, "Gorra New Era"), sale("b", "vinted", "2026-10-11", 15, "Camiseta Nike vintage")];
    expect(pickSale(c, { platform: "vinted", day: day("2026-10-10"), price: 15, product: "Gorra New Era 9FORTY" })?.id).toBe("a");
    const d = [sale("a", "vinted", "2026-10-10", 15, "Gorra New Era"), sale("b", "vinted", "2026-10-11", 15, "Gorra New Era")];
    expect(pickSale(d, { platform: "vinted", day: day("2026-10-10"), price: 15, product: "Gorra New Era" })).toBeNull();
  });
});
