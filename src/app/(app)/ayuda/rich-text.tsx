import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/** Enlace de la ayuda: la misma letra, en verde y subrayada. */
export const helpLink = "text-brand-ink underline decoration-1 underline-offset-[3px] hover:decoration-2";

/** Convierte [texto](/ruta) en enlaces internos; cualquier otra cosa queda como texto. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]\n]{1,80})\]\((\/[a-z0-9\-/?=&#]*)\)/gi;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <Link key={m.index} href={m[2]} className={helpLink}>
        {m[1]}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Párrafos (línea en blanco) y pasos («1. …»). Sin HTML: todo se escapa. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.replace(/\r/g, "").replace(/\*\*/g, "").split(/\n\s*\n/);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
        if (!lines.length) return null;
        if (lines.every((l) => /^(\d+[.)]|[-•])\s+/.test(l))) {
          const ordered = /^\d/.test(lines[0]);
          const Tag = ordered ? "ol" : "ul";
          return (
            <Tag key={i} className={ordered ? "ml-5 list-decimal space-y-1 marker:text-faint" : "ml-5 list-disc space-y-1 marker:text-faint"}>
              {lines.map((l, j) => (
                <li key={j} className="pl-1">{inline(l.replace(/^(\d+[.)]|[-•])\s+/, ""))}</li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
