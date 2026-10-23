"use client";
import { useT } from "@/i18n/client";
import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "@/components/ui";
import { FAQ, SHOTS } from "./faq";
import { RichText } from "./rich-text";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ ]/g, " ");


export function FaqList() {
  const t = useT();
  // Índice de búsqueda en el idioma del usuario (y las palabras clave en español también valen)
  const INDEX = useMemo(() => FAQ.flatMap((g) => g.items.map((f) => ({ id: f.id, text: norm(`${t(f.q)} ${f.tags ?? ""} ${t(f.a)} ${f.q}`) }))), [t]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  // /ayuda#importar abre esa pregunta
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id || !FAQ.some((g) => g.items.some((i) => i.id === id))) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el hash solo existe en el navegador
    setOpen(id);
    requestAnimationFrame(() => document.getElementById(`faq-${id}`)?.scrollIntoView({ block: "center" }));
  }, []);

  const hits = useMemo(() => {
    const words = norm(q).split(" ").filter((w) => w.length > 1);
    if (!words.length) return null;
    return new Set(INDEX.filter((i) => words.every((w) => i.text.includes(w))).map((i) => i.id));
  }, [q, INDEX]);

  return (
    <div>
      <label className="relative mb-6 block">
        <span className="sr-only">{t("Buscar en la ayuda")}</span>
        <Search size={18} strokeWidth={1.75} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input
          type="text"
          enterKeyHint="search"
          role="searchbox"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("Busca tu duda: importar, Gmail, devolución…")}
          className="h-12 w-full rounded-[var(--radius-md)] border border-line bg-surface-2 pl-11 pr-11 text-[15px] text-ink outline-none placeholder:text-faint focus:border-brand"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label={t("Borrar búsqueda")} className="press absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-faint hover:text-ink">
            <X size={16} strokeWidth={2} />
          </button>
        )}
      </label>

      {hits && hits.size === 0 && (
        <p className="mb-6 rounded-[var(--radius-md)] border border-dashed border-line px-5 py-6 text-center text-[14px] text-muted">
          {t("No hay ninguna pregunta con «{q}». Escríbela abajo y te respondemos.", { q })}
        </p>
      )}

      <div className="flex flex-col gap-8">
        {FAQ.map((g) => {
          const items = g.items.filter((f) => !hits || hits.has(f.id));
          if (!items.length) return null;
          return (
            <section key={g.id} aria-labelledby={`g-${g.id}`}>
              <h2 id={`g-${g.id}`} className="mono mb-2.5 px-1 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">
                {t(g.title)}
              </h2>
              <ul className="rs-card divide-y divide-line overflow-hidden rounded-[var(--radius-md)] bg-surface">
                {items.map((f) => {
                  const isOpen = open === f.id || (!!hits && hits.size <= 2);
                  const shot = f.shot ? SHOTS[f.shot] : null;
                  return (
                    <li key={f.id} id={`faq-${f.id}`}>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : f.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-a-${f.id}`}
                        className="flex min-h-14 w-full items-center gap-3 px-5 py-3.5 text-left text-[15px] font-medium text-ink hover:bg-subtle/60"
                      >
                        <span className="flex-1">{t(f.q)}</span>
                        <ChevronDown size={18} strokeWidth={1.75} className={clsx("shrink-0 text-faint transition-transform duration-200", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <div id={`faq-a-${f.id}`} className="animate-rise px-5 pb-5">
                          <RichText text={t(f.a)} className="flex max-w-[68ch] flex-col gap-3 text-[14.5px] leading-relaxed text-ink-soft" />
                          {shot && (
                            // eslint-disable-next-line @next/next/no-img-element -- captura estática ya optimizada (webp)
                            <img
                              src={t.locale === "es" ? `/ayuda/${f.shot}.webp` : `/ayuda/${t.locale}/${f.shot}.webp`}
                              width={shot.w}
                              height={shot.h}
                              alt={t(shot.alt)}
                              loading="lazy"
                              decoding="async"
                              className="mt-4 h-auto w-full max-w-[760px] rounded-[var(--radius-sm)] border border-line bg-surface-2"
                            />
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
