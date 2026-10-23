"use client";
/**
 * «Burbuja» que marca la opción activa y viaja de una a otra como una gota
 * (estilo Liquid Glass): al moverse se estira hasta cubrir el camino, se
 * aplasta un poco y vuelve a su forma al llegar.
 *
 * Uso: un contenedor con `position: relative`, las opciones con
 * `data-bubble="<clave>"` y <LiquidBubble container={ref} active="<clave>" />.
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import clsx from "clsx";

type Box = { x: number; y: number; w: number; h: number };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

function measure(container: HTMLElement, key: string): Box | null {
  const el = container.querySelector<HTMLElement>(`[data-bubble="${CSS.escape(key)}"]`);
  if (!el) return null;
  const c = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: r.left - c.left + container.scrollLeft, y: r.top - c.top + container.scrollTop, w: r.width, h: r.height };
}

const place = (b: Box) => ({ transform: `translate(${b.x}px, ${b.y}px)`, width: `${b.w}px`, height: `${b.h}px` });

export function LiquidBubble({
  container,
  active,
  axis = "x",
  className,
}: {
  container: RefObject<HTMLElement | null>;
  active: string | null;
  axis?: "x" | "y";
  className?: string;
}) {
  const bubble = useRef<HTMLSpanElement>(null);
  const last = useRef<Box | null>(null);

  // Ir a la opción activa (con viaje si ya estaba en otra)
  useIso(() => {
    const c = container.current;
    const b = bubble.current;
    if (!c || !b) return;
    const to = active != null ? measure(c, active) : null;
    if (!to) {
      b.style.opacity = "0";
      last.current = null;
      return;
    }
    const from = last.current;
    Object.assign(b.style, place(to), { opacity: "1" });
    last.current = to;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";
    if (!from || reduce || typeof b.animate !== "function") return;
    if (Math.abs(from.x - to.x) < 1 && Math.abs(from.y - to.y) < 1 && Math.abs(from.w - to.w) < 1) return;

    // A mitad de camino la gota cubre las dos posiciones y se aplasta un poco
    const mid: Box =
      axis === "x"
        ? { x: Math.min(from.x, to.x), y: to.y, w: Math.max(from.x + from.w, to.x + to.w) - Math.min(from.x, to.x), h: to.h }
        : { x: to.x, y: Math.min(from.y, to.y), w: to.w, h: Math.max(from.y + from.h, to.y + to.h) - Math.min(from.y, to.y) };
    const dist = axis === "x" ? Math.abs(to.x - from.x) : Math.abs(to.y - from.y);
    const squash = axis === "x" ? "scaleY(0.84)" : "scaleX(0.84)";
    const duration = Math.min(560, 340 + dist * 0.35);
    b.animate(
      [
        { ...place(from), offset: 0 },
        { transform: `translate(${mid.x}px, ${mid.y}px) ${squash}`, width: `${mid.w}px`, height: `${mid.h}px`, offset: 0.48, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
        { transform: `translate(${to.x}px, ${to.y}px) ${axis === "x" ? "scale(1.04, 0.97)" : "scale(0.97, 1.04)"}`, width: `${to.w}px`, height: `${to.h}px`, offset: 0.82 },
        { ...place(to), offset: 1 },
      ],
      { duration, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
    );
  }, [active, axis, container]);

  // Si cambia el tamaño (ventana, menú desplegado), se recoloca sin animación.
  // Solo cuando la medida cambia de verdad: así no corta el viaje de la burbuja.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    const c = container.current;
    const b = bubble.current;
    if (!c || !b || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const key = activeRef.current;
      if (key == null) return;
      const to = measure(c, key);
      const prev = last.current;
      if (!to || (prev && Math.abs(prev.x - to.x) < 0.5 && Math.abs(prev.y - to.y) < 0.5 && Math.abs(prev.w - to.w) < 0.5 && Math.abs(prev.h - to.h) < 0.5)) return;
      if (b.getAnimations().length) return;
      Object.assign(b.style, place(to), { opacity: "1" });
      last.current = to;
    });
    ro.observe(c);
    c.querySelectorAll("[data-bubble]").forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [container]);

  return (
    <span
      ref={bubble}
      aria-hidden
      className={clsx("pointer-events-none absolute left-0 top-0 z-0 rounded-full bg-ink opacity-0 will-change-transform", className)}
      style={{ transformOrigin: "center" }}
    />
  );
}

/** Grupo de opciones con burbuja: las opciones llevan `data-bubble="<clave>"`. */
export function BubbleGroup({
  active,
  axis = "x",
  className,
  bubbleClassName,
  children,
  label,
}: {
  active: string | null;
  axis?: "x" | "y";
  className?: string;
  bubbleClassName?: string;
  children: React.ReactNode;
  /** Si se indica, el grupo es un <nav> con ese nombre. */
  label?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = label ? "nav" : "div";
  return (
    <Tag ref={ref as never} aria-label={label} className={clsx("relative", className)}>
      <LiquidBubble container={ref} active={active} axis={axis} className={bubbleClassName} />
      {children}
    </Tag>
  );
}
