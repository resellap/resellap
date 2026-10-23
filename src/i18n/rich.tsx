import { Fragment, type ReactNode } from "react";

/**
 * Frase traducida con partes con formato o enlaces:
 *   rich(t("Acepto las <a>condiciones</a> y la <b>política de privacidad</b>"), {
 *     a: (c) => <Link href="/terminos">{c}</Link>,
 *     b: (c) => <Link href="/privacidad">{c}</Link>,
 *   })
 * Así cada idioma ordena la frase a su manera sin partirla en trozos.
 */
export function rich(text: string, tags: Record<string, (chunk: ReactNode) => ReactNode>): ReactNode {
  const out: ReactNode[] = [];
  const re = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let last = 0;
  let i = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const f = tags[m[1]];
    out.push(<Fragment key={i++}>{f ? f(m[2]) : m[2]}</Fragment>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
