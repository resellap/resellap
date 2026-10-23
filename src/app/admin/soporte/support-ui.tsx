"use client";
import { useState, useTransition } from "react";
import { Button, clsx, Notice } from "@/components/ui";
import { replySupportAction, setFeedbackStatusAction } from "../actions";

export function ReplyForm({ id, again }: { id: number; again: boolean }) {
  const [open, setOpen] = useState(!again);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-fit text-[13px] font-medium text-brand-ink hover:underline">
        Añadir otra respuesta
      </button>
    );
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await replySupportAction(id, text);
          setMsg(r.ok ? { ok: true, text: r.message ?? "Enviada." } : { ok: false, text: r.error });
          if (r.ok) setText("");
        });
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={6000}
        placeholder="Escribe la respuesta. Puedes enlazar pantallas así: [Nueva venta](/ventas/nueva)"
        className="w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-faint focus:border-brand"
      />
      {msg && <Notice tone={msg.ok ? "good" : "bad"}>{msg.text}</Notice>}
      <Button type="submit" variant="primary" disabled={pending || text.trim().length < 2} className="w-fit">
        {pending ? "Enviando…" : "Responder"}
      </Button>
    </form>
  );
}

const STATES = [
  ["nuevo", "Nuevo"],
  ["visto", "Visto"],
  ["resuelto", "Resuelto"],
] as const;

export function FeedbackStatus({ id, status }: { id: number; status: (typeof STATES)[number][0] }) {
  const [current, setCurrent] = useState(status);
  const [pending, start] = useTransition();
  return (
    <div role="radiogroup" aria-label="Estado" className="flex w-fit gap-1 rounded-[var(--radius-sm)] border border-line p-0.5">
      {STATES.map(([k, label]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={current === k}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const prev = current;
              setCurrent(k);
              const r = await setFeedbackStatusAction(id, k);
              if (!r.ok) setCurrent(prev);
            })
          }
          className={clsx("min-h-8 rounded-[8px] px-3 text-[12.5px] font-medium", current === k ? "bg-ink text-paper" : "text-muted hover:text-ink")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
