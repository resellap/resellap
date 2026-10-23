"use client";
import { Check, LoaderCircle, Send, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { Button, Notice } from "@/components/ui";
import { askSupport, resolveSupport, sendToSupport } from "./actions";
import { RichText } from "./rich-text";

type State =
  | { step: "idle" }
  | { step: "answer"; id: number; question: string; answer: string | null }
  | { step: "solved" }
  | { step: "sent" };

export function AskBox() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<State>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"ask" | "direct" | "yes" | "no" | null>(null);

  const run = (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setError(null);
    setBusy(kind);
    start(async () => {
      await fn();
      setBusy(null);
    });
  };

  const ask = () =>
    run("ask", async () => {
      const r = await askSupport({ question, page: "/ayuda" });
      if (!r.ok) return setError(r.error);
      setState({ step: "answer", id: r.data!.id, question, answer: r.data!.answer });
    });

  const direct = () =>
    run("direct", async () => {
      const r = await sendToSupport({ question, page: "/ayuda" });
      if (!r.ok) return setError(r.error);
      setState({ step: "sent" });
      setQuestion("");
    });

  const resolve = (s: Extract<State, { step: "answer" }>, ok: boolean) =>
    run(ok ? "yes" : "no", async () => {
      const r = await resolveSupport(s.id, ok, s.question);
      if (!r.ok) return setError(r.error);
      setState({ step: ok ? "solved" : "sent" });
      setQuestion("");
    });

  const reset = () => {
    setState({ step: "idle" });
    setError(null);
  };

  if (state.step === "solved" || state.step === "sent") {
    return (
      <div className="flex flex-col items-start gap-3">
        <Notice tone="good" title={state.step === "solved" ? "¡Genial!" : "Enviado a soporte"}>
          {state.step === "solved"
            ? "Nos alegra que te haya servido."
            : "Te responderemos lo antes posible. Verás la respuesta en «Tus consultas» y también te llegará por correo."}
        </Notice>
        <Button onClick={reset}>Hacer otra pregunta</Button>
      </div>
    );
  }

  if (state.step === "answer") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-muted">
          Tu pregunta: <span className="text-ink-soft">{state.question}</span>
        </p>
        {state.answer ? (
          <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
            <p className="mono mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-faint">
              <Sparkles size={13} strokeWidth={2} className="text-brand" />
              Respuesta automática
            </p>
            <RichText text={state.answer} className="flex flex-col gap-2.5 text-[14.5px] leading-relaxed text-ink-soft" />
          </div>
        ) : (
          <Notice tone="info">No hemos encontrado una respuesta automática. ¿La enviamos a soporte para que te responda una persona?</Notice>
        )}
        {error && <Notice tone="bad">{error}</Notice>}
        <div className="flex flex-wrap items-center gap-2">
          {state.answer && <span className="mr-1 text-[14px] font-medium text-ink">¿Te ha servido?</span>}
          {state.answer && (
            <Button onClick={() => resolve(state, true)} disabled={pending}>
              {busy === "yes" ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2} />}
              Sí, resuelto
            </Button>
          )}
          <Button variant="primary" onClick={() => resolve(state, false)} disabled={pending}>
            {busy === "no" ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={15} strokeWidth={2} />}
            {state.answer ? "No, enviar a soporte" : "Enviar a soporte"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        ask();
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-medium text-muted">Tu pregunta, duda o problema</span>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={2000}
          required
          placeholder="Por ejemplo: ¿cómo cambio el precio de una venta ya registrada?"
          className="min-h-24 w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-faint focus:border-brand"
        />
      </label>
      {error && <Notice tone="bad">{error}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending || question.trim().length < 3}>
          {busy === "ask" ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} strokeWidth={2} />}
          {busy === "ask" ? "Buscando la respuesta…" : "Preguntar"}
        </Button>
        <button
          type="button"
          onClick={direct}
          disabled={pending || question.trim().length < 3}
          className="press min-h-10 rounded-[var(--radius-sm)] px-3 text-[13.5px] font-medium text-muted hover:text-ink disabled:opacity-50"
        >
          {busy === "direct" ? "Enviando…" : "Prefiero escribir directamente a soporte"}
        </button>
      </div>
    </form>
  );
}
