"use client";
import { useState, useTransition } from "react";
import { Button, Notice, Select } from "@/components/ui";
import { sendTestEmailsAction, type SampleId } from "./actions";

const LANGS = [
  ["es", "Español"],
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["it", "Italiano"],
  ["pt", "Português"],
] as const;

export function TestEmails({ items }: { items: { id: SampleId; label: string; when: string }[] }) {
  const [lang, setLang] = useState("es");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const send = (id: SampleId | "all") =>
    start(async () => {
      const r = await sendTestEmailsAction(id, lang);
      setMsg(r.ok ? { ok: true, text: r.message ?? "Enviado." } : { ok: false, text: r.error });
    });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[14px]">
          Idioma
          <Select value={lang} onChange={(e) => setLang(e.target.value)} className="w-40">
            {LANGS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </label>
        <Button variant="primary" disabled={pending} onClick={() => send("all")}>
          {pending ? "Enviando…" : "Enviarme todos de prueba"}
        </Button>
      </div>
      {msg && <Notice tone={msg.ok ? "good" : "bad"}>{msg.text}</Notice>}
      <ul className="rs-card divide-y divide-line overflow-hidden rounded-[var(--radius-md)] bg-surface">
        {items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-medium text-ink">{i.label}</div>
              <div className="text-[13px] text-muted">{i.when}</div>
            </div>
            <Button size="sm" disabled={pending} onClick={() => send(i.id)}>
              Probar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
