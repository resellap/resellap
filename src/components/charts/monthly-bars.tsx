"use client";
import { useFormat, useT } from "@/i18n/client";
import { useState } from "react";

type Point = { month: string; revenue: number; profit: number; orders: number; units: number };

/**
 * Ventas por mes: barra verde gruesa = facturación; dentro, barra negra
 * más estrecha = beneficio. Cifra solo en el último mes y en el máximo, y el
 * detalle de cada mes al pasar el ratón o tocar.
 */
export function MonthlyBars({ data, unit = "mes", height = 220 }: { data: Point[]; unit?: "mes" | "semana" | "dia"; height?: number }) {
  const t = useT();
  const f = useFormat();
  const axisLabel = (k: string) => (unit === "mes" ? f.monthLabel(k) : unit === "semana" ? dayMonth(k, f.tag) : String(Number(k.slice(8, 10))));
  const longLabel = (k: string) => (unit === "mes" ? f.monthLabel(k) : unit === "semana" ? t("Semana del {date}", { date: dayMonth(k, f.tag) }) : dayMonth(k, f.tag));
  const every = data.length > 16 ? 5 : 1;
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const W = 640;
  const H = height;
  const pad = { l: 52, r: 12, t: 22, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const band = innerW / Math.max(1, data.length);
  const barW = Math.min(40, band * 0.7);
  const y = (v: number) => pad.t + innerH - (v / top) * innerH;
  const maxIdx = data.reduce((best, d, i) => (d.revenue > data[best].revenue ? i : best), 0);
  const last = data.length - 1;

  if (asTable) {
    return (
      <div>
        <div className="mb-2 flex justify-end">
          <button className="text-[13px] font-semibold text-brand-ink underline-offset-2 hover:underline" onClick={() => setAsTable(false)}>
            {t("Ver gráfico")}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[12.5px] text-muted">
              <th className="py-1.5 font-semibold">{unit === "mes" ? t("Mes") : unit === "semana" ? t("Semana") : t("Día")}</th>
              <th className="py-1.5 text-right font-semibold">{t("Vendido")}</th>
              <th className="py-1.5 text-right font-semibold">{t("Beneficio")}</th>
              <th className="py-1.5 text-right font-semibold">{t("Pedidos")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-t border-line/70">
                <td className="py-1.5">{longLabel(d.month)}</td>
                <td className="num py-1.5 text-right">{f.money(d.revenue)}</td>
                <td className="num py-1.5 text-right">{f.money(d.profit)}</td>
                <td className="num py-1.5 text-right">{f.units(d.orders)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const h = hover !== null ? data[hover] : null;
  const base = pad.t + innerH;
  const bar = (x: number, yTop: number, w: number) => {
    const hgt = Math.max(0, base - yTop);
    const r = Math.min(6, hgt, w / 2);
    return `M${x - w / 2},${base} V${yTop + r} Q${x - w / 2},${yTop} ${x - w / 2 + r},${yTop} H${x + w / 2 - r} Q${x + w / 2},${yTop} ${x + w / 2},${yTop + r} V${base} Z`;
  };
  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
        <span className="flex items-center gap-4 text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-brand" aria-hidden />{" "}{t("Ventas")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-ink" aria-hidden />{" "}{t("Beneficio bruto")}
          </span>
        </span>
        <button className="font-semibold text-brand-ink underline-offset-2 hover:underline" onClick={() => setAsTable(true)}>
          {t("Ver como tabla")}
        </button>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={unit === "mes" ? t("Ingresos y beneficio bruto por mes") : unit === "semana" ? t("Ingresos y beneficio bruto por semana") : t("Ingresos y beneficio bruto por día")}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.l} x2={W - pad.r} y1={y(tick)} y2={y(tick)} className="stroke-line" strokeWidth={1} />
            <text x={pad.l - 8} y={y(tick) + 4} textAnchor="end" fontSize={11} className="num fill-muted">
              {compactEur(tick, f.tag)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.l + band * i + band / 2;
          const yTop = y(d.revenue);
          const yProfit = y(Math.max(0, Math.min(d.profit, d.revenue)));
          const showLabel = d.revenue > 0 && (i === last || i === maxIdx);
          const dim = hover !== null && hover !== i;
          return (
            <g key={d.month} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} className="cursor-pointer">
              <rect x={pad.l + band * i} y={pad.t} width={band} height={innerH} fill="transparent" />
              {d.revenue > 0 && (
                <g style={{ opacity: dim ? 0.35 : 1, transition: "opacity .15s" }}>
                  <path
                    d={bar(x, yTop, barW)}
                    className="fill-brand"
                    style={{ transformOrigin: `${x}px ${base}px`, animation: `grow .6s ${i * 40}ms cubic-bezier(.2,.8,.2,1) both` }}
                  />
                  {d.profit > 0 && (
                    <path
                      d={bar(x, yProfit, barW * 0.5)}
                      className="fill-ink"
                      style={{ transformOrigin: `${x}px ${base}px`, animation: `grow .6s ${i * 40 + 120}ms cubic-bezier(.2,.8,.2,1) both` }}
                    />
                  )}
                </g>
              )}
              {showLabel && (
                <text x={x} y={yTop - 7} textAnchor="middle" fontSize={12} fontWeight={700} className="num fill-ink">
                  {compactEur(d.revenue, f.tag)}
                </text>
              )}
              {(i % every === 0 || i === last || hover === i) && (
                <text x={x} y={H - 9} textAnchor="middle" fontSize={11} className={hover === i ? "fill-ink" : "fill-muted"}>
                  {axisLabel(d.month)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={pad.l} x2={W - pad.r} y1={base} y2={base} className="stroke-line-strong" strokeWidth={1} />
      </svg>
      <style>{`@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
      {h && (
        <div
          className="pointer-events-none absolute top-10 animate-fade rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-[13px] shadow-[var(--shadow-pop)]"
          style={{ left: `clamp(0px, calc(${((pad.l + band * hover! + band / 2) / W) * 100}% - 80px), calc(100% - 170px))` }}
        >
          <p className="font-semibold">{longLabel(h.month)}</p>
          <p className="num">{t("Ventas:")}{" "}{f.money(h.revenue)}</p>
          <p className="num">{t("Beneficio bruto:")}{" "}{f.money(h.profit)}</p>
          <p className="num text-muted">
            {f.units(h.orders)}{" "}{t("pedidos, {units} uds.", { units: f.units(h.units) })}
          </p>
        </div>
      )}
    </div>
  );
}

function dayMonth(iso: string, tag: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(tag, { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "");
}

function niceStep(raw: number) {
  if (raw <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function compactEur(v: number, tag: string) {
  return new Intl.NumberFormat(tag, { style: "currency", currency: "EUR", notation: v >= 1000 ? "compact" : "standard", maximumFractionDigits: v >= 1000 ? 1 : 0 }).format(v);
}
