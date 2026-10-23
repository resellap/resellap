import type { Metadata } from "next";
import { Badge, Notice, PageHeader, Panel, Tabs } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FeedbackStatus, ReplyForm } from "./support-ui";

export const metadata: Metadata = { title: "Soporte y feedback" };

type Fb = { id: number; organization_name: string; user_email: string | null; kind: "idea" | "fallo" | "otro"; message: string; page: string | null; screenshot_path: string | null; status: "nuevo" | "visto" | "resuelto"; created_at: string };
type Rq = { id: number; organization_name: string; user_email: string | null; question: string; page: string | null; ai_answer: string | null; status: "ia" | "resuelto" | "abierto" | "respondido"; reply: string | null; replied_at: string | null; created_at: string };

const KIND = { idea: ["Idea", "info"], fallo: ["Fallo", "bad"], otro: ["Otro", "neutral"] } as const;
const RQ = { abierto: ["Esperando respuesta", "warn"], respondido: ["Respondida", "good"], resuelto: ["Resuelta por la IA", "neutral"], ia: ["Respondida por la IA, sin valorar", "neutral"] } as const;

/** Bandeja de soporte: dudas que la IA no ha resuelto y feedback de los usuarios. */
export default async function SupportInbox({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const view = (await searchParams).vista === "feedback" ? "feedback" : "consultas";
  const supabase = await createClient();
  const [rq, fb] = await Promise.all([supabase.rpc("platform_support_requests"), supabase.rpc("platform_feedback")]);
  const requests = (rq.data ?? []) as Rq[];
  const feedback = (fb.data ?? []) as Fb[];
  const open = requests.filter((r) => r.status === "abierto").length;
  const fresh = feedback.filter((f) => f.status === "nuevo").length;

  // Capturas: enlace temporal (10 min), solo para lo que se muestra
  const shots = new Map<string, string>();
  const paths = view === "feedback" ? feedback.map((f) => f.screenshot_path).filter((p): p is string => !!p) : [];
  if (paths.length) {
    const { data } = await createAdminClient().storage.from("feedback").createSignedUrls(paths, 600);
    for (const s of data ?? []) if (s.path && s.signedUrl) shots.set(s.path, s.signedUrl);
  }

  return (
    <>
      <PageHeader title="Soporte y feedback" description="Dudas que la respuesta automática no resolvió y lo que nos cuentan los usuarios. Lo que respondas aparece en su centro de ayuda y le llega por correo." />
      {(rq.error || fb.error) && <Notice tone="bad" className="mb-4">No se han podido cargar los datos.</Notice>}
        <Tabs
          current={view}
          items={[
            { key: "consultas", href: "/admin/soporte", label: `Consultas${open ? ` (${open})` : ""}` },
            { key: "feedback", href: "/admin/soporte?vista=feedback", label: `Feedback${fresh ? ` (${fresh})` : ""}` },
          ]}
        />

      {view === "consultas" ? (
        <Panel padded={false}>
          {requests.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted">Todavía no hay consultas.</p>
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <Badge tone={RQ[r.status][1]} dot>{RQ[r.status][0]}</Badge>
                    <span className="font-semibold text-ink-soft">{r.organization_name}</span>
                    <span className="text-muted">{r.user_email}</span>
                    <span className="num ml-auto text-xs text-faint">{dateTime(r.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-[15px] font-medium text-ink">{r.question}</p>
                  {r.ai_answer && (
                    <details className="text-[13px] text-muted">
                      <summary className="cursor-pointer select-none">Ver la respuesta automática</summary>
                      <p className="mt-1.5 whitespace-pre-wrap border-l-2 border-line pl-3">{r.ai_answer}</p>
                    </details>
                  )}
                  {r.reply && (
                    <p className="whitespace-pre-wrap border-l-2 border-brand pl-3 text-[14px] text-ink-soft">
                      {r.reply}
                      <span className="num mt-1 block text-xs text-faint">Respondida {dateTime(r.replied_at)}</span>
                    </p>
                  )}
                  {(r.status === "abierto" || r.status === "respondido") && <ReplyForm id={r.id} again={r.status === "respondido"} />}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : (
        <Panel padded={false}>
          {feedback.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted">Todavía no hay feedback.</p>
          ) : (
            <ul className="divide-y divide-line">
              {feedback.map((f) => (
                <li key={f.id} className="flex flex-col gap-2 px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <Badge tone={KIND[f.kind][1]}>{KIND[f.kind][0]}</Badge>
                    <span className="font-semibold text-ink-soft">{f.organization_name}</span>
                    <span className="text-muted">{f.user_email}</span>
                    {f.page && <span className="mono text-xs text-faint">{f.page}</span>}
                    <span className="num ml-auto text-xs text-faint">{dateTime(f.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-[15px] text-ink">{f.message}</p>
                  {f.screenshot_path && shots.get(f.screenshot_path) && (
                    <a href={shots.get(f.screenshot_path)} target="_blank" rel="noreferrer" className="w-fit">
                      {/* eslint-disable-next-line @next/next/no-img-element -- enlace temporal firmado */}
                      <img src={shots.get(f.screenshot_path)} alt="Captura adjunta" className="max-h-48 rounded-[var(--radius-sm)] border border-line" loading="lazy" />
                    </a>
                  )}
                  <FeedbackStatus id={f.id} status={f.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </>
  );
}
