/**
 * Componentes visuales básicos (sin estado). Se pueden usar en el
 * servidor y en el cliente.
 */
import { Tx } from "@/i18n/tx";
import clsx from "clsx";
import { BackLink } from "./list-memory";
import Link from "next/link";
import { BubbleGroup } from "./liquid";
import type { ComponentProps, ReactNode } from "react";

export { clsx };

// ---------------------------------------------------------------------
// Botones
// ---------------------------------------------------------------------
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const buttonBase =
  "press inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] font-semibold tracking-[-0.005em] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap select-none [&_svg]:shrink-0";
const buttonVariants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(0_0_0/0.25)] hover:bg-brand-strong",
  secondary: "bg-elevated text-ink border border-line-strong shadow-[inset_0_1px_0_rgb(255_255_255/0.03)] hover:bg-subtle",
  ghost: "text-ink-soft hover:bg-subtle hover:text-ink",
  danger: "bg-transparent text-danger border border-danger/35 hover:bg-danger-soft",
};
const buttonSizes: Record<Size, string> = {
  sm: "h-11 px-3.5 text-[14px] sm:h-9 sm:px-3 sm:text-[13px]",
  md: "h-11 px-4 text-[14px] sm:h-10",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return clsx(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({ variant = "secondary", size = "md", className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" {...props} className={buttonClass(variant, size, className)} />;
}

export function LinkButton({ variant = "secondary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

// ---------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------
// Texto a 16px en el móvil: así el iPhone no hace zoom al escribir
const control =
  "w-full rounded-[var(--radius-sm)] border border-line-strong bg-surface-2 px-3 text-base text-ink shadow-[inset_0_1px_2px_rgb(0_0_0/0.12)] placeholder:text-faint transition-[border-color,box-shadow,background-color] hover:border-field focus:border-brand focus:bg-surface focus:outline-none focus:ring-3 focus:ring-brand/20 disabled:opacity-60 sm:text-[14px]";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={clsx(control, "h-11", props.type === "number" && "num", className)} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select {...props} className={clsx(control, "h-11 pr-8", className)}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={clsx(control, "min-h-20 py-2", className)} />;
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
  required,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Si se indica, la etiqueta apunta a ese id; si no, envuelve el control. */
  htmlFor?: string;
  required?: boolean;
}) {
  const text = (
    <span className="text-[12.5px] font-medium text-muted">
      {label}
      {required && <span className="text-danger"> *</span>}
    </span>
  );
  const help = (
    <>
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </>
  );
  if (htmlFor !== undefined) {
    return (
      <div className={clsx("flex flex-col gap-1.5", className)}>
        <label htmlFor={htmlFor || undefined}>{text}</label>
        {children}
        {help}
      </div>
    );
  }
  return (
    <label className={clsx("flex flex-col gap-1.5", className)}>
      {text}
      {children}
      {help}
    </label>
  );
}

// ---------------------------------------------------------------------
// Estructura de página
// ---------------------------------------------------------------------
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && <BackLink href={back.href} label={back.label} />}
        <h1 className="display text-[32px] font-semibold tracking-[-0.03em] text-ink text-balance sm:text-[44px]">{title}</h1>
        {description && <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={clsx("overflow-hidden rs-card rounded-[var(--radius-md)] bg-surface", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2 px-5 pb-1 pt-5 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className={clsx(padded && "p-5 sm:p-6", padded && (title || actions) && "pt-3 sm:pt-4")}>{children}</div>
    </section>
  );
}

/** Franja de cifras clave: un solo bloque dividido, no tarjetas sueltas. */
export function Figures({
  items,
  className,
}: {
  items: {
    label: ReactNode;
    value: ReactNode;
    note?: ReactNode;
    tone?: "default" | "good" | "bad";
  }[];
  className?: string;
}) {
  return (
    <dl
      className={clsx(
        "rs-card grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] bg-line max-sm:[&>*:last-child:nth-child(odd)]:col-span-2 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]",
        className,
      )}
    >
      {items.map((it, i) => (
        <div key={i} className="bg-surface px-4 py-3.5 sm:px-5 sm:py-4">
          <dt className="mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">{it.label}</dt>
          <dd className={clsx("num mt-2 text-[24px] font-semibold leading-none tracking-[-0.03em] sm:text-[28px]", it.tone === "good" && "text-good", it.tone === "bad" && "text-danger")}>{it.value}</dd>
          {it.note && <p className="mt-0.5 text-[12.5px] text-faint">{it.note}</p>}
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, num, className }: { children?: ReactNode; num?: boolean; className?: string }) {
  return (
    <th
      scope="col"
      className={clsx(
        "mono sticky top-0 z-[1] border-b border-line-strong bg-surface px-3 py-2.5 text-left text-[10.5px] font-medium uppercase tracking-[0.07em] text-faint",
        num && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, num, className, colSpan }: { children?: ReactNode; num?: boolean; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={clsx("border-b border-line/70 px-3 py-2.5 align-top", num && "num text-right", className)}>
      {children}
    </td>
  );
}

export function Tr({ children, className, muted }: { children: ReactNode; className?: string; muted?: boolean }) {
  return <tr className={clsx("transition-colors hover:bg-subtle/60", muted && "text-muted", className)}>{children}</tr>;
}

// ---------------------------------------------------------------------
// Estados y etiquetas
// ---------------------------------------------------------------------
type Tone = "neutral" | "good" | "warn" | "bad" | "info";
const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-muted",
  good: "bg-good-soft text-good-ink",
  warn: "bg-warn-soft text-warn",
  bad: "bg-danger-soft text-danger",
  info: "bg-subtle text-ink-soft",
};

export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; /** Punto de estado delante del texto. */ dot?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] px-1.5 py-0.5 text-[11.5px] font-semibold leading-[1.35] whitespace-nowrap", tones[tone], className)}>
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-[2px] bg-current" />}
      {children}
    </span>
  );
}

/** Pegatina del pedido/lote de procedencia. */
export function LotTag({ label, origin }: { label: string | null | undefined; origin?: "compra" | "ajuste" | string | null }) {
  if (!label) return <Badge tone="warn"><Tx>Lote no identificado</Tx></Badge>;
  return (
    <span className="lot-tag" data-origin={origin ?? (label.startsWith("Ajuste") ? "ajuste" : "compra")}>
      {label}
    </span>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge tone="neutral"><Tx>Sin stock</Tx></Badge>;
  return <span className="num font-semibold">{stock}</span>;
}

export function Notice({ tone = "info", title, children, className }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div
      role={tone === "bad" ? "alert" : "status"}
      className={clsx(
        "animate-rise rounded-[var(--radius-sm)] border border-l-[3px] px-4 py-3 text-sm",
        tone === "bad" && "border-danger/25 border-l-danger bg-danger-soft text-danger",
        tone === "warn" && "border-warn/25 border-l-warn bg-warn-soft text-warn",
        tone === "good" && "border-good/20 border-l-good bg-good-soft text-good-ink",
        tone === "info" && "border-line border-l-line-strong bg-surface text-ink-soft",
        tone === "neutral" && "border-line border-l-line-strong bg-surface-2 text-ink-soft",
        className,
      )}
    >
      {/* Los textos sueltos (p. ej. errores que llegan del servidor) se traducen aquí */}
      {title && <p className="font-semibold">{typeof title === "string" ? <Tx>{title}</Tx> : title}</p>}
      {children && <div className={clsx(title && "mt-0.5", "text-[13.5px] [&_a]:underline")}>{typeof children === "string" ? <Tx>{children}</Tx> : children}</div>}
    </div>
  );
}

export function Empty({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 px-4 py-12 sm:items-center sm:text-center">
      <span aria-hidden className="mb-1 flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2">
        <svg viewBox="0 0 96 96" width="20" height="20"><path fill="var(--line-strong)" d="M0 0H36V48H0ZM44 0H72A24 24 0 0 1 72 48H44ZM0 56H36V96H0Z" /><path fill="var(--brand-mark)" d="M44 56H68L96 96H72Z" /></svg>
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="max-w-[60ch] text-sm text-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------
// Paginación (con enlaces, funciona sin JavaScript)
// ---------------------------------------------------------------------
export function Pagination({ page, size, total, hrefFor }: { page: number; size: number; total: number; hrefFor: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1)
    return (
      <p className="px-3 py-3 text-[13px] text-muted">
        {total === 1 ? <Tx>1 resultado</Tx> : <Tx vars={{ n: total }}>{"{n} resultados"}</Tx>}
      </p>
    );
  return (
    <nav className="flex items-center justify-between gap-2 px-3 py-3 text-[13px]" aria-labelledby="pag-label">
      <span id="pag-label" className="sr-only"><Tx>Paginación</Tx></span>
      <span className="text-muted">
        <Tx vars={{ from: (page - 1) * size + 1, to: Math.min(page * size, total), total }}>{"{from}–{to} de {total}"}</Tx>
      </span>
      <span className="flex gap-1.5">
        {page > 1 ? (
          <LinkButton size="sm" href={hrefFor(page - 1)}>
            <Tx>Anterior</Tx>
          </LinkButton>
        ) : (
          <Button size="sm" disabled>
            <Tx>Anterior</Tx>
          </Button>
        )}
        {page < pages ? (
          <LinkButton size="sm" href={hrefFor(page + 1)}>
            <Tx>Siguiente</Tx>
          </LinkButton>
        ) : (
          <Button size="sm" disabled>
            <Tx>Siguiente</Tx>
          </Button>
        )}
      </span>
    </nav>
  );
}

export function Tabs({ items, current }: { items: { href: string; label: string; key: string }[]; current: string }) {
  return (
    <BubbleGroup label="Secciones" active={current} className="no-scrollbar mb-5 flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-[12px] bg-surface p-1 rs-card">
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === current ? "page" : undefined}
          data-bubble={t.key}
          data-on={String(t.key === current)}
          className={clsx(
            "rs-seg press flex min-h-9 items-center whitespace-nowrap rounded-[8px] px-3.5 text-[13.5px] font-medium",
          )}
        >
          {t.label}
        </Link>
      ))}
    </BubbleGroup>
  );
}
