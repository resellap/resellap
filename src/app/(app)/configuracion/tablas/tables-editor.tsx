"use client";
import { useT } from "@/i18n/client";
import { ArrowDown, ArrowUp, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { Field, Panel, Select, clsx } from "@/components/ui";
import { useServerAction } from "@/components/ui-client";
import { DEFAULT_PREFS, FIXED_COLUMNS, PAGE_SIZES, PRODUCT_COLUMNS, PRODUCT_SORTS, SALES_COLUMNS, type Prefs } from "@/lib/preferences";
import { resetPreferences, savePreferences } from "../actions";
import { SaveBar } from "../settings-ui";

type T = Prefs["tables"];
type Col<K extends string> = { key: K; visible: boolean };

function Columns<K extends string>({ cols, labels, onChange }: { cols: Col<K>[]; labels: Record<K, string>; onChange: (c: Col<K>[]) => void }) {
  const t = useT();
  const move = (i: number, to: number) => {
    if (to < 0 || to >= cols.length) return;
    const next = [...cols];
    const [it] = next.splice(i, 1);
    next.splice(to, 0, it);
    onChange(next);
  };
  const visibleCount = cols.filter((c) => c.visible).length;
  return (
    <ul className="-mx-4 divide-y divide-line">
      {cols.map((c, i) => {
        const fixed = FIXED_COLUMNS.has(c.key);
        return (
          <li key={c.key} className="flex items-center gap-3 px-4 py-1.5">
            <label className={clsx("flex min-h-11 flex-1 items-center gap-3 text-[15px]", fixed ? "cursor-default" : "cursor-pointer")}>
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--color-brand)]"
                checked={c.visible}
                disabled={fixed || (c.visible && visibleCount === 1)}
                onChange={(e) => onChange(cols.map((x) => (x.key === c.key ? { ...x, visible: e.target.checked } : x)))}
              />
              <span className={c.visible ? "font-semibold" : "text-muted"}>{t(labels[c.key])}</span>
              {fixed && <Lock size={13} className="text-faint" aria-label={t("Siempre visible")} />}
            </label>
            <button type="button" aria-label={t("Subir {label}", { label: t(labels[c.key]) })} onClick={() => move(i, i - 1)} disabled={i === 0} className="press flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-ink/6 disabled:opacity-30 md:h-9 md:w-9">
              <ArrowUp size={17} />
            </button>
            <button type="button" aria-label={t("Bajar {label}", { label: t(labels[c.key]) })} onClick={() => move(i, i + 1)} disabled={i === cols.length - 1} className="press flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-ink/6 disabled:opacity-30 md:h-9 md:w-9">
              <ArrowDown size={17} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function TablesEditor({ initial }: { initial: T }) {
  const t = useT();
  const [saved, setSaved] = useState<T>(initial);
  const [tb, setTb] = useState<T>(initial);
  const { run, pending, error, message } = useServerAction(savePreferences<"tables">);
  const dirty = useMemo(() => JSON.stringify(tb) !== JSON.stringify(saved), [tb, saved]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("Ventas")} description={t("Marca las columnas que quieres ver y ordénalas con las flechas.")}>
          <Columns cols={tb.ventas.columns} labels={SALES_COLUMNS} onChange={(columns) => setTb({ ...tb, ventas: { ...tb.ventas, columns } })} />
          <Field label={t("Filas por página")} className="mt-4">
            <Select value={tb.ventas.pageSize} onChange={(e) => setTb({ ...tb, ventas: { ...tb.ventas, pageSize: Number(e.target.value) } })}>
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
        </Panel>
        <Panel title={t("Productos")} description={t("También se aplica al orden de las tarjetas en el móvil.")}>
          <Columns cols={tb.productos.columns} labels={PRODUCT_COLUMNS} onChange={(columns) => setTb({ ...tb, productos: { ...tb.productos, columns } })} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t("Orden predeterminado")}>
              <Select value={tb.productos.sort} onChange={(e) => setTb({ ...tb, productos: { ...tb.productos, sort: e.target.value as T["productos"]["sort"] } })}>
                {Object.entries(PRODUCT_SORTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {t(v)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("Filas por página")}>
              <Select value={tb.productos.pageSize} onChange={(e) => setTb({ ...tb, productos: { ...tb.productos, pageSize: Number(e.target.value) } })}>
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Panel>
      </div>
      <p className="text-[13px] text-muted">{t("Los filtros que apliques en Ventas y Productos se recuerdan mientras navegas por la misma sección.")}</p>
      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={async () => {
          const r = await run("tables", JSON.parse(JSON.stringify(tb)));
          if (r.ok) setSaved(tb);
        }}
        onDiscard={() => setTb(saved)}
        error={error}
        message={message}
        reset={{
          label: t("Tablas iniciales"),
          description: t("Todas las columnas visibles en su orden original, 50 filas por página y productos con más stock primero."),
          action: () => resetPreferences("tables"),
          onDone: () => {
            setTb(DEFAULT_PREFS.tables);
            setSaved(DEFAULT_PREFS.tables);
          },
        }}
      />
    </div>
  );
}
