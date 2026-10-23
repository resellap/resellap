// Genera las capturas del centro de ayuda (public/ayuda/*.webp) con una
// flecha y un recuadro verdes que señalan dónde pulsar.
//
// Uso (con la app arrancada y datos de ejemplo):
//   BASE=http://localhost:3100 EMAIL=… PASSWORD=… node scripts/capturas-ayuda.mjs [id …]
// Requiere Playwright (variable PW con la ruta del módulo si no está instalado aquí).
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const { chromium } = await import(process.env.PW ?? "playwright");
const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = new URL("../public/ayuda/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const GREEN = "#36C784";

/** id → pantalla, qué señalar, texto de la etiqueta, alto del recorte (px) */
const SHOTS = [
  { id: "nueva-venta", path: "/ventas/nueva", target: (p) => p.getByRole("combobox").or(p.getByPlaceholder(/busca/i)).first(), label: "1. Busca el producto", h: 700 },
  { id: "crear-producto", path: "/productos", target: (p) => p.getByRole("link", { name: "Nuevo producto" }).first(), label: "Pulsa aquí", h: 520 },
  { id: "nuevo-pedido", path: "/compras", target: (p) => p.getByRole("link", { name: "Nuevo pedido" }).first(), label: "Pulsa aquí", h: 520 },
  { id: "importar", path: "/importar", target: (p) => p.getByText("Elegir archivo", { exact: true }).first(), label: "Elige tu Excel", h: 560, pad: 230 },
  {
    id: "gmail",
    path: "/correos",
    // Como lo ve alguien que aún no ha conectado su correo
    prepare: async (p) =>
      p.evaluate(() => {
        for (const b of document.querySelectorAll("main button, main a")) {
          if (b.textContent?.trim() === "Volver a conectar") b.lastChild.textContent = "Conectar Gmail";
          if (["Revisar ahora", "Desconectar", "Desconectar Gmail"].includes(b.textContent?.trim() ?? "")) b.style.visibility = "hidden";
        }
        for (const el of document.querySelectorAll("main [role=status], main [role=alert], main aside")) el.style.display = "none";
        for (const el of document.querySelectorAll("main p")) if (/@gmail\.com$/.test(el.textContent?.trim() ?? "")) el.textContent = "tunegocio@gmail.com";
        for (const el of document.querySelectorAll("main span")) if (el.textContent?.trim() === "Conectado") el.style.visibility = "hidden";
      }),
    target: (p) => p.getByText("Conectar Gmail", { exact: true }).first(),
    label: "Conecta tu Gmail",
    h: 620,
    pad: 200,
  },
  { id: "detectadas", path: "/detectadas", target: (p) => p.getByRole("button", { name: "Confirmar venta" }).first(), label: "Revisa y confirma", h: 560, above: true, pad: 330 },
  { id: "envios", path: "/envios", target: (p) => p.getByRole("link", { name: /Ver pedidos/ }).first(), label: "Entra en el transportista", h: 620 },
  { id: "equipo", path: "/equipo", target: (p) => p.getByRole("button", { name: "Invitar" }).or(p.getByRole("link", { name: "Invitar" })).first(), label: "Pulsa aquí", h: 520 },
];

/** Dibuja el recuadro, la flecha curva y la etiqueta sobre la página. */
function drawArrow({ box, label, green, above }) {
  document.getElementById("rs-help-overlay")?.remove();
  const pad = 6;
  const r = { x: box.x - pad, y: box.y - pad, w: box.width + pad * 2, h: box.height + pad * 2 };
  const W = document.documentElement.clientWidth;
  // La flecha llega por debajo del objetivo (a su izquierda si es muy ancho)
  const tx = r.w > 400 ? r.x + 90 : r.x + r.w / 2;
  const ex = tx;
  const ey = above ? r.y - 4 : r.y + r.h + 4;
  const sx = tx + (tx > W - 320 ? -150 : 150);
  const sy = above ? ey - 105 : ey + 105;
  const cx = tx + (sx - tx) * 0.15;
  const cy = above ? sy + 10 : sy - 10;
  const ang = Math.atan2(ey - cy, ex - cx);
  const head = (a) => `${ex - 13 * Math.cos(ang + a)},${ey - 13 * Math.sin(ang + a)}`;
  const o = document.createElement("div");
  o.id = "rs-help-overlay";
  o.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483647";
  o.innerHTML = `
    <div style="position:absolute;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;border:2px solid ${green};border-radius:12px;box-shadow:0 0 0 5px rgb(54 199 132 / .18)"></div>
    <svg width="${W}" height="${document.documentElement.scrollHeight}" style="position:absolute;left:0;top:0;overflow:visible">
      <path d="M${sx},${sy} Q${cx},${cy} ${ex},${ey}" fill="none" stroke="${green}" stroke-width="3" stroke-linecap="round"/>
      <path d="M${head(0.45)} L${ex},${ey} L${head(-0.45)}" fill="none" stroke="${green}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div style="position:absolute;left:${sx}px;top:${above ? sy - 38 : sy + 8}px;transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:${green};color:#05140D;font:600 14px/1.2 'Instrument Sans',system-ui,sans-serif;white-space:nowrap">${label}</div>`;
  document.body.appendChild(o);
  return { x: r.x, y: r.y, w: r.w, h: r.h, top: Math.min(r.y, above ? sy - 40 : r.y), sy: above ? r.y + r.h : sy + 40 };
}

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await browser.newContext({ viewport: { width: 1290, height: 1000 }, deviceScaleFactor: 1.5, locale: "es-ES", timezoneId: "Europe/Madrid", colorScheme: "dark" });
const page = await ctx.newPage();
await page.goto(BASE + "/login");
await page.fill("#email", process.env.EMAIL ?? "");
await page.fill("#password", process.env.PASSWORD ?? "");
await page.press("#password", "Enter");
await page.waitForURL((u) => !u.pathname.startsWith("/login"));
await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" }).catch(() => {});

const only = process.argv.slice(2);
for (const s of SHOTS.filter((x) => !only.length || only.includes(x.id))) {
  await page.goto(BASE + s.path);
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important} nextjs-portal{display:none!important} header.fixed,header.sticky,body>div>header,aside[aria-label=\"Más secciones\"],nav[aria-label=\"Accesos rápidos\"]{visibility:hidden!important}" });
  await s.prepare?.(page);
  const el = s.target(page);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await el.boundingBox();
  if (!box) throw new Error(`${s.id}: no encuentro el elemento`);
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const abs = { x: box.x + scroll.x, y: box.y + scroll.y, width: box.width, height: box.height };
  const r = await page.evaluate(drawArrow, { box: abs, label: s.label, green: GREEN, above: !!s.above });
  // Recorte de 1200 × h centrado en lo señalado (dentro de la zona de contenido)
  const W = 1200;
  const pageW = await page.evaluate(() => document.documentElement.scrollWidth);
  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  // Zona de contenido (el menú lateral y la barra superior se ocultan)
  const x = Math.max(0, Math.min(pageW - W, 72));
  let y = r.top - (s.pad ?? 140);
  if (r.sy + 30 > y + s.h) y = r.sy + 30 - s.h;
  y = Math.max(0, Math.min(pageH - s.h, y));
  const png = await page.screenshot({ clip: { x, y, width: W, height: s.h }, fullPage: true });
  await sharp(png).resize(W).webp({ quality: 82 }).toFile(`${OUT}${s.id}.webp`);
  console.log("ok", s.id);
}
await browser.close();
