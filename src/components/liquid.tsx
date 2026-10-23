"use client";
/**
 * Indicador de la opción activa (la «burbuja»): una cápsula que se desliza
 * con un muelle suave de una opción a otra.
 *
 * - Solo se animan transform y tamaño de un único elemento (barato y fluido).
 * - El color del texto cambia a la vez que llega la burbuja: las opciones
 *   llevan `data-on`, que este componente actualiza, y el CSS hace el resto.
 * - Al pulsar, la burbuja sale al instante (no espera a que cargue la página).
 *
 * Uso: contenedor con `position: relative`; opciones con
 * `data-bubble="<clave>"` y la clase `rs-seg` (o sus propios colores con
 * `data-[on=true]:`).
 */
import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

type Box = { x: number; y: number; w: number; h: number };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

function itemOf(container: HTMLElement, key: string) {
  return container.querySelector<HTMLElement>(`[data-bubble="${CSS.escape(key)}"]`);
}

function measure(container: HTMLElement, el: HTMLElement): Box | null {
  const c = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: r.left - c.left + container.scrollLeft - container.clientLeft, y: r.top - c.top + container.scrollTop - container.clientTop, w: r.width, h: r.height };
}

function apply(b: HTMLElement, box: Box) {
  b.style.transform = `translate3d(${box.x}px, ${box.y}px, 0)`;
  b.style.width = `${box.w}px`;
  b.style.height = `${box.h}px`;
}

export function LiquidBubble({ container, active, className }: { container: RefObject<HTMLElement | null>; active: string | null; className?: string }) {
  const bubble = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  useIso(() => {
    const c = container.current;
    const b = bubble.current;
    if (!c || !b) return;
    // Colores: la opción activa se marca con data-on (el resto, sin)
    c.querySelectorAll<HTMLElement>("[data-bubble]").forEach((el) => {
      el.dataset.on = String(active != null && el.dataset.bubble === active);
    });
    const el = active != null ? itemOf(c, active) : null;
    const box = el ? measure(c, el) : null;
    if (!box) {
      b.style.opacity = "0";
      placed.current = false;
      return;
    }
    if (!placed.current) {
      // Primera vez (o al reaparecer): se coloca sin viaje
      b.classList.add("rs-bubble-still");
      apply(b, box);
      void b.offsetWidth;
      b.classList.remove("rs-bubble-still");
      b.style.opacity = "1";
      placed.current = true;
      return;
    }
    apply(b, box);
    b.style.opacity = "1";
  }, [active, container]);

  // Cambios de tamaño (ventana, menú desplegado, fuentes): se recoloca sin viaje
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    const c = container.current;
    const b = bubble.current;
    if (!c || !b || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const key = activeRef.current;
        const el = key != null ? itemOf(c, key) : null;
        const box = el ? measure(c, el) : null;
        if (!box) return;
        // También coloca la burbuja si al principio no se podía medir
        // (pantalla de carga, menú oculto…)
        b.classList.add("rs-bubble-still");
        apply(b, box);
        void b.offsetWidth;
        b.classList.remove("rs-bubble-still");
        b.style.opacity = "1";
        placed.current = true;
      });
    });
    ro.observe(c);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [container]);

  return <span ref={bubble} aria-hidden className={clsx("rs-bubble", className)} />;
}

/**
 * Grupo de opciones con burbuja. Las opciones llevan `data-bubble="<clave>"`.
 * Al pulsar una, la burbuja va hacia ella enseguida, aunque la página
 * todavía esté cargando.
 */
export function BubbleGroup({
  active,
  className,
  bubbleClassName,
  children,
  label,
}: {
  active: string | null;
  className?: string;
  bubbleClassName?: string;
  children: React.ReactNode;
  /** Si se indica, el grupo es un <nav> con ese nombre. */
  label?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [seen, setSeen] = useState(active);
  if (seen !== active) {
    setSeen(active);
    setPending(null);
  }
  const Tag = label ? "nav" : "div";
  return (
    <Tag
      ref={ref as never}
      aria-label={label}
      className={clsx("relative", className)}
      onClickCapture={(e: React.MouseEvent) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        const el = (e.target as HTMLElement).closest<HTMLElement>("[data-bubble]");
        if (el?.dataset.bubble != null) setPending(el.dataset.bubble);
      }}
    >
      <LiquidBubble container={ref} active={pending ?? active} className={bubbleClassName} />
      {children}
    </Tag>
  );
}
