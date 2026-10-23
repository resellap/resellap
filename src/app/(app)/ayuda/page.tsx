import type { Metadata } from "next";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { AskBox } from "./ask-box";
import { FaqList } from "./faq-list";
import { OpenFeedbackButton } from "./open-feedback";
import { RichText } from "./rich-text";

export const metadata: Metadata = { title: "Ayuda y soporte" };

type Req = { id: number; question: string; status: "abierto" | "respondido"; reply: string | null; replied_at: string | null; created_at: string };

export default async function HelpPage() {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_support_requests");
  const mine = (data ?? []) as Req[];

  return (
    <>
      <PageHeader
        title="Ayuda y soporte"
        description="Cómo funciona Resellap, paso a paso. Busca tu duda o, si no está, pregúntala abajo."
        actions={<OpenFeedbackButton />}
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <FaqList />
        <div className="flex flex-col gap-5 xl:sticky xl:top-24">
          <Panel title="¿No encuentras tu respuesta?" description="Escribe tu duda. Te respondemos al momento y, si no te sirve, la ve una persona del equipo de soporte.">
            <AskBox />
          </Panel>
          {mine.length > 0 && (
            <Panel title="Tus consultas" padded={false}>
              <ul className="divide-y divide-line">
                {mine.map((r) => (
                  <li key={r.id} className="px-5 py-4">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <Badge tone={r.status === "respondido" ? "good" : "warn"} dot>
                        {r.status === "respondido" ? "Respondida" : "Esperando respuesta"}
                      </Badge>
                      <span className="num text-xs text-faint">{dateTime(r.created_at)}</span>
                    </div>
                    <p className="text-[14px] font-medium text-ink">{r.question}</p>
                    {r.reply && (
                      <div className="mt-2 border-l-2 border-brand pl-3">
                        <RichText text={r.reply} className="flex flex-col gap-2 text-[13.5px] leading-relaxed text-ink-soft" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
