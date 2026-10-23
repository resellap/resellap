"use client";
/**
 * Generador de descripciones (pantalla).
 * Orden pensado para el móvil: 1 productos → 2 características →
 * 3 tono y plataforma → 4 hashtags y extensión → generar → copiar o editar.
 * Los datos que se rellenan aquí NO se guardan en la ficha del producto.
 */
import { useFormat, useT } from "@/i18n/client";
import { Check, ChevronDown, Copy, Eraser, History, Pencil, RefreshCw, Trash2, WandSparkles, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { ProductPicker } from "@/components/product-picker";
import { Button, Field, Input, Notice, Select, Textarea, clsx } from "@/components/ui";
import { Modal } from "@/components/ui-client";
import { ProductThumb } from "@/app/(app)/productos/product-cards";
import { type SellableVariant, variantDisplay } from "@/lib/types";
import { generateDescriptions, type GenerateRequest, type GeneratedItem } from "./actions";
import { CONDITIONS, LENGTHS, MAX_PRODUCTS, PLATFORMS, TONES, type Length, type PlatformKey, type ProductDetails, type Tone } from "./options";

type Selected = { key: string; variant: SellableVariant; details: ProductDetails; open: boolean };
type Result = GeneratedItem & { key: string; editing?: boolean; copied?: boolean };
type HistoryEntry = { id: string; at: string; title: string; platform: string; tone: string; text: string };

const HISTORY_KEY = "mi:descripciones:historial";
const HISTORY_MAX = 30;
const GENERIC_VARIANT = /^(única|unica|sin especificar)$/i;

/** Rellena lo que ya sabemos del inventario (marca, modelo, categoría, variante, precio). */
function prefill(v: SellableVariant): ProductDetails {
  const brand = v.brand_name ?? "";
  let model = v.product_name;
  if (brand && model.toLowerCase().startsWith(brand.toLowerCase())) model = model.slice(brand.length).replace(/^[\s\-–—·:]+/, "");
  return {
    brand,
    model,
    category: v.category_name ?? "",
    variant: v.variant_name && !GENERIC_VARIANT.test(v.variant_name) ? v.variant_name : "",
    frameColor: "",
    lens: "",
    condition: "",
    features: "",
    defects: "",
    accessories: "",
    price: v.normal_sale_price !== null ? String(v.normal_sale_price).replace(".", ",") : "",
    extra: "",
  };
}

function readHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}
function writeHistory(h: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, HISTORY_MAX)));
  } catch {
    /* sin almacenamiento: el historial simplemente no se guarda */
  }
}

async function copyText(text: string, fallbackEl?: HTMLTextAreaElement | null) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (fallbackEl) {
      fallbackEl.select();
      return document.execCommand?.("copy") ?? false;
    }
    return false;
  }
}

function Chip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      title={title}
      onClick={onClick}
      className={clsx(
        "press min-h-10 rounded-full border px-4 py-1.5 text-[13.5px] font-semibold",
        active ? "border-brand bg-brand text-on-brand" : "border-line-strong bg-surface text-ink hover:border-ink/40",
      )}
    >
      {children}
    </button>
  );
}

function Section({ n, title, children, className }: { n: number; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx("rs-card rounded-[var(--radius-md)] bg-surface p-4 shadow-[var(--shadow-card)]", className)}>
      <h2 className="display mb-3 flex items-center gap-2.5 text-[22px]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[15px] text-paper">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DescriptionGenerator({ configured }: { configured: boolean }) {
  const t = useT();
  const f = useFormat();
  const [selected, setSelected] = useState<Selected[]>([]);
  const [tone, setTone] = useState<Tone>("natural");
  const [platform, setPlatform] = useState<PlatformKey>("wallapop");
  const [otherPlatform, setOtherPlatform] = useState("");
  const [hashtags, setHashtags] = useState(false);
  const [length, setLength] = useState<Length>("media");
  const [instructions, setInstructions] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const inFlight = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState<HistoryEntry | null>(null);

  // El historial vive solo en este dispositivo
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage al montar
    setHistory(readHistory());
  }, []);

  const platformName = platform === "otra" ? otherPlatform.trim() || t("Otra plataforma") : PLATFORMS[platform];
  const full = selected.length >= MAX_PRODUCTS;

  function add(v: SellableVariant) {
    if (full) return;
    if (selected.some((s) => s.variant.variant_id === v.variant_id)) return;
    setSelected((ss) => [...ss.map((s) => ({ ...s, open: false })), { key: `${v.variant_id}-${Date.now()}`, variant: v, details: prefill(v), open: true }]);
  }
  const remove = (key: string) => setSelected((ss) => ss.filter((s) => s.key !== key));
  const setDetail = (key: string, k: keyof ProductDetails, value: string) =>
    setSelected((ss) => ss.map((s) => (s.key === key ? { ...s, details: { ...s.details, [k]: value } } : s)));

  function request(items: Selected[]): GenerateRequest {
    return {
      items: items.map((s) => ({ productId: s.variant.product_id, variantId: s.variant.variant_id, details: s.details })),
      tone,
      platform,
      otherPlatform: otherPlatform.trim(),
      hashtags,
      length,
      instructions: instructions.trim(),
    };
  }

  function saveToHistory(items: GeneratedItem[]) {
    const now = new Date().toISOString();
    const entries = items
      .filter((r) => r.text)
      .map((r, i) => ({ id: `${now}-${i}`, at: now, title: r.title, platform: platformName, tone: t(TONES[tone].label), text: r.text! }));
    if (!entries.length) return;
    const next = [...entries, ...readHistory()].slice(0, HISTORY_MAX);
    writeHistory(next);
    setHistory(next);
  }

  /** Genera para todos los seleccionados, o solo para uno (volver a generar). */
  function generate(only?: Selected) {
    if (inFlight.current || !configured) return; // evita dobles pulsaciones
    const items = only ? [only] : selected;
    if (!items.length) return;
    if (platform === "otra" && !otherPlatform.trim()) {
      setError(t("Escribe el nombre de la plataforma."));
      return;
    }
    inFlight.current = true;
    setError(null);
    setBusyKey(only ? only.key : null);
    startTransition(async () => {
      try {
        const res = await generateDescriptions(request(items));
        if (!res.ok) {
          setError(res.error);
          return;
        }
        const got = (res.data ?? []).map((r, i) => ({ ...r, key: items[i].key }));
        saveToHistory(got);
        setResults((prev) => {
          if (!only) return got;
          const rest = prev.filter((p) => p.key !== only.key);
          const idx = prev.findIndex((p) => p.key === only.key);
          const out = [...rest];
          out.splice(idx < 0 ? out.length : idx, 0, got[0]);
          return out;
        });
        if (!only) setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      } catch {
        setError(t("No se ha podido conectar con el servidor. Comprueba la conexión."));
      } finally {
        inFlight.current = false;
        setBusyKey(null);
      }
    });
  }

  const updateResult = (key: string, patch: Partial<Result>) => setResults((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <div className="grid gap-5 max-md:pb-24 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        {/* 1 · Productos */}
        <Section n={1} title={t("Productos")}>
          <ProductPicker onSelect={add} placeholder={t("Busca por nombre, marca o referencia (p. ej. Oakley Encoder)")} />
          <p className="mt-2 text-[12.5px] text-muted">
            {full ? t("Máximo {MAX_PRODUCTS} productos a la vez.", { MAX_PRODUCTS }) : t("Puedes elegir hasta {MAX_PRODUCTS}. Se genera una descripción para cada uno.", { MAX_PRODUCTS })}
          </p>
          {selected.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {selected.map((s) => (
                <li key={s.key} className="flex animate-rise items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 p-2 pr-2.5">
                  <ProductThumb url={s.variant.photo_url ?? undefined} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {variantDisplay(s.variant.product_name, s.variant.variant_name, s.variant.variant_count)}
                    </span>
                    <span className="block truncate text-[12px] text-muted">
                      {[
                        s.variant.brand_name,
                        s.variant.sku,
                        s.variant.stock > 0 ? t("{n} en stock", { n: f.units(s.variant.stock) }) : t("Sin stock"),
                        s.variant.normal_sale_price !== null ? f.money(s.variant.normal_sale_price) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(s.key)}
                    className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-ink/6 hover:text-danger"
                    aria-label={t("Quitar {product_name}", { product_name: s.variant.product_name })}
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 2 · Características */}
        {selected.length > 0 && (
          <Section n={2} title={t("Características")}>
            <p className="mb-3 text-[12.5px] text-muted">
              {t("Ya vienen rellenas con lo que hay en el inventario. Lo que cambies aquí solo se usa para este anuncio.")}
            </p>
            <div className="flex flex-col gap-2.5">
              {selected.map((s) => {
                const d = s.details;
                const f = (k: keyof ProductDetails) => ({ value: d[k], onChange: (e: { target: { value: string } }) => setDetail(s.key, k, e.target.value) });
                return (
                  <div key={s.key} className="overflow-hidden rounded-[var(--radius-sm)] border border-line">
                    <button
                      type="button"
                      onClick={() => setSelected((ss) => ss.map((x) => (x.key === s.key ? { ...x, open: !x.open } : x)))}
                      aria-expanded={s.open}
                      className="press flex w-full items-center justify-between gap-2 bg-surface-2 px-3 py-2.5 text-left text-sm font-semibold"
                    >
                      <span className="min-w-0 truncate">{variantDisplay(s.variant.product_name, s.variant.variant_name, s.variant.variant_count)}</span>
                      <ChevronDown size={18} className={clsx("shrink-0 transition-transform", s.open && "rotate-180")} />
                    </button>
                    {s.open && (
                      <div className="grid animate-rise gap-3 p-3 sm:grid-cols-2">
                        <Field label={t("Marca")}>
                          <Input {...f("brand")} maxLength={300} />
                        </Field>
                        <Field label={t("Modelo")}>
                          <Input {...f("model")} maxLength={300} />
                        </Field>
                        <Field label={t("Tipo de producto")}>
                          <Input {...f("category")} maxLength={300} placeholder={t("Gafas de sol, Lego…")} />
                        </Field>
                        <Field label={t("Variante")}>
                          <Input {...f("variant")} maxLength={300} />
                        </Field>
                        <Field label={t("Color de la montura")}>
                          <Input {...f("frameColor")} maxLength={300} placeholder={t("Negro mate")} />
                        </Field>
                        <Field label={t("Color o tipo de lente")}>
                          <Input {...f("lens")} maxLength={300} placeholder={t("Transparente")} />
                        </Field>
                        <Field label={t("Estado")}>
                          <Select {...f("condition")}>
                            <option value="">{t("Sin indicar")}</option>
                            {CONDITIONS.map((c) => (
                              <option key={c} value={c}>
                                {t(c)}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label={t("Precio de venta (€)")} hint={t("Opcional. Déjalo vacío para no mencionarlo.")}>
                          <Input {...f("price")} inputMode="decimal" maxLength={20} />
                        </Field>
                        <Field label={t("Accesorios incluidos")} className="sm:col-span-2">
                          <Input {...f("accessories")} maxLength={300} placeholder={t("Funda, caja, bolsa…")} />
                        </Field>
                        <Field label={t("Características a destacar")} className="sm:col-span-2">
                          <Textarea {...f("features")} maxLength={800} className="min-h-16" />
                        </Field>
                        <Field label={t("Defectos o desperfectos")} className="sm:col-span-2" hint={t("Si no indicas ninguno, no se menciona nada.")}>
                          <Textarea {...f("defects")} maxLength={800} className="min-h-14" />
                        </Field>
                        <Field label={t("Información adicional")} className="sm:col-span-2">
                          <Textarea {...f("extra")} maxLength={800} className="min-h-14" />
                        </Field>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* 3 · Tono y plataforma */}
        <Section n={selected.length ? 3 : 2} title={t("Tono y plataforma")}>
          <p className="mb-2 text-[13px] font-semibold text-ink-soft">{t("Tono")}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Tono")}>
            {(Object.keys(TONES) as Tone[]).map((k) => (
              <Chip key={k} active={tone === k} onClick={() => setTone(k)} title={t(TONES[k].hint)}>
                {t(TONES[k].label)}
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted">{t(TONES[tone].hint)}.</p>
          <p className="mb-2 mt-4 text-[13px] font-semibold text-ink-soft">{t("Plataforma")}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Plataforma")}>
            {(Object.keys(PLATFORMS) as PlatformKey[]).map((p) => (
              <Chip key={p} active={platform === p} onClick={() => setPlatform(p)}>
                {t(PLATFORMS[p])}
              </Chip>
            ))}
          </div>
          {platform === "otra" && (
            <Field label={t("Nombre de la plataforma")} className="mt-3 animate-rise">
              <Input value={otherPlatform} onChange={(e) => setOtherPlatform(e.target.value)} maxLength={60} placeholder={t("Todocolección, Depop…")} />
            </Field>
          )}
        </Section>

        {/* 4 · Hashtags, extensión e indicaciones */}
        <Section n={selected.length ? 4 : 3} title={t("Hashtags y extensión")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink-soft">{t("Hashtags")}</p>
              <div className="flex gap-2" role="radiogroup" aria-label={t("Hashtags")}>
                <Chip active={hashtags} onClick={() => setHashtags(true)}>
                  {t("Incluir")}
                </Chip>
                <Chip active={!hashtags} onClick={() => setHashtags(false)}>
                  {t("No incluir")}
                </Chip>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink-soft">{t("Extensión")}</p>
              <div className="flex gap-2" role="radiogroup" aria-label={t("Extensión")}>
                {(Object.keys(LENGTHS) as Length[]).map((l) => (
                  <Chip key={l} active={length === l} onClick={() => setLength(l)}>
                    {t(LENGTHS[l])}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          <Field
            label={t("Instrucciones adicionales")}
            className="mt-4"
            hint={t("Por ejemplo: «No utilices emojis», «Destaca que nunca se han usado», «No menciones el precio».")}
          >
            <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={800} className="min-h-16" />
          </Field>
        </Section>

        {error && <Notice tone="bad">{error}</Notice>}

        <Button
          variant="primary"
          className="h-12 w-full text-[15px] max-md:hidden"
          disabled={!configured || !selected.length || pending}
          onClick={() => generate()}
        >
          <WandSparkles size={18} strokeWidth={2.25} />
          {pending && !busyKey ? t("Generando…") : selected.length > 1 ? t("Generar {length} descripciones", { length: selected.length }) : t("Generar descripción")}
        </Button>
      </div>

      {/* 5-6 · Resultados */}
      <div ref={resultsRef} className="flex min-w-0 scroll-mt-20 flex-col gap-5">
        <section className="rs-card rounded-[var(--radius-md)] bg-surface p-4 shadow-[var(--shadow-card)]" aria-live="polite">
          <h2 className="display mb-3 text-[22px]">{t("Resultado")}</h2>
          {pending && !busyKey && (
            <div className="flex flex-col gap-2.5" aria-label={t("Generando")}>
              {(selected.length ? selected : [null]).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-[var(--radius-sm)] bg-surface-2" />
              ))}
              <p className="text-[13px] text-muted">{selected.length > 1 ? t("Escribiendo las descripciones… suele tardar unos segundos.") : t("Escribiendo la descripción… suele tardar unos segundos.")}</p>
            </div>
          )}
          {!pending && results.length === 0 && (
            <p className="text-sm text-muted">{t("Aquí aparecerá el texto listo para copiar y pegar en {platformName}. No se publica nada automáticamente.", { platformName })}</p>
          )}
          {(!pending || busyKey) && results.length > 0 && (
            <div className="flex flex-col gap-4">
              {results.map((r) => {
                const sel = selected.find((s) => s.key === r.key);
                const busy = busyKey === r.key;
                return (
                  <article key={r.key} className="animate-rise rounded-[var(--radius-sm)] border border-line p-3">
                    <p className="mb-2 text-[13px] font-semibold">{r.title}</p>
                    {r.error ? (
                      <Notice tone="bad">{r.error}</Notice>
                    ) : (
                      <Textarea
                        id={`res-${r.key}`}
                        value={r.text ?? ""}
                        readOnly={!r.editing}
                        onChange={(e) => updateResult(r.key, { text: e.target.value })}
                        className={clsx("min-h-48 font-[inherit] leading-relaxed", !r.editing && "bg-surface-2", busy && "opacity-50")}
                        aria-label={t("Descripción de {title}", { title: r.title })}
                      />
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {!r.error && (
                        <Button
                          size="sm"
                          variant={r.copied ? "secondary" : "primary"}
                          onClick={async () => {
                            const ok = await copyText(r.text ?? "", document.getElementById(`res-${r.key}`) as HTMLTextAreaElement | null);
                            if (ok) {
                              updateResult(r.key, { copied: true });
                              setTimeout(() => updateResult(r.key, { copied: false }), 2000);
                            }
                          }}
                        >
                          {r.copied ? <Check size={16} strokeWidth={2.75} className="text-good" /> : <Copy size={16} strokeWidth={2.25} />}
                          {r.copied ? t("¡Copiado!") : t("Copiar")}
                        </Button>
                      )}
                      {sel && (
                        <Button size="sm" disabled={pending} onClick={() => generate(sel)}>
                          <RefreshCw size={16} strokeWidth={2.25} className={busy ? "animate-spin" : undefined} />
                          {busy ? t("Generando…") : t("Volver a generar")}
                        </Button>
                      )}
                      {!r.error && (
                        <Button size="sm" variant="ghost" onClick={() => updateResult(r.key, { editing: !r.editing })}>
                          <Pencil size={15} strokeWidth={2.25} />
                          {r.editing ? t("Listo") : t("Editar")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setResults((rs) => rs.filter((x) => x.key !== r.key))}>
                        <Eraser size={15} strokeWidth={2.25} />
                        {t("Limpiar")}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {history.length > 0 && (
          <details className="group rs-card rounded-[var(--radius-md)] bg-surface shadow-[var(--shadow-card)]">
            <summary className="press flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
              <span className="display flex items-center gap-2 text-[20px]">
                <History size={18} strokeWidth={2.25} className="text-brand" />
                {t("Historial")}
                <span className="num text-[15px] text-muted">({history.length})</span>
              </span>
              <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-line px-4 pb-4 pt-2">
              <p className="mb-2 text-[12px] text-muted">{t("Las últimas {HISTORY_MAX} descripciones, guardadas solo en este dispositivo.", { HISTORY_MAX })}</p>
              <ul className="flex flex-col divide-y divide-line">
                {history.map((h) => (
                  <li key={h.id}>
                    <button type="button" onClick={() => setShowHistory(h)} className="press flex w-full flex-col items-start gap-0.5 py-2.5 text-left">
                      <span className="text-sm font-semibold">{h.title}</span>
                      <span className="text-[12px] text-muted">
                        {f.dateTime(h.at)} · {h.platform} · {h.tone}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-danger"
                onClick={() => {
                  writeHistory([]);
                  setHistory([]);
                }}
              >
                <Trash2 size={15} strokeWidth={2.25} />
                {t("Borrar historial")}
              </Button>
            </div>
          </details>
        )}
      </div>

      {/* Botón fijo abajo (móvil) */}
      <div className="fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-20 px-4 md:hidden no-print">
        <Button
          variant="primary"
          className="mx-auto h-12 w-full max-w-xl text-[15px] shadow-[var(--shadow-pop)]"
          disabled={!configured || !selected.length || pending}
          onClick={() => generate()}
        >
          <WandSparkles size={18} strokeWidth={2.25} />
          {pending && !busyKey
            ? t("Generando…")
            : !selected.length
              ? t("Elige un producto")
              : selected.length > 1
                ? t("Generar {length} descripciones", { length: selected.length })
                : t("Generar descripción")}
        </Button>
      </div>

      <Modal
        open={!!showHistory}
        onClose={() => setShowHistory(null)}
        title={showHistory?.title ?? ""}
        footer={
          <>
            <Button onClick={() => setShowHistory(null)}>{t("Cerrar")}</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (showHistory && (await copyText(showHistory.text))) setShowHistory(null);
              }}
            >
              <Copy size={16} />{" "}{t("Copiar")}
            </Button>
          </>
        }
      >
        {showHistory && (
          <>
            <p className="mb-2 text-[12px] text-muted">
              {f.dateTime(showHistory.at)} · {showHistory.platform} · {showHistory.tone}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{showHistory.text}</p>
          </>
        )}
      </Modal>
    </div>
  );
}
