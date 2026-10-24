// Textos traducibles de Resellap.
//
//   node scripts/i18n.mjs            → lista lo que falta por traducir en cada idioma
//   node scripts/i18n.mjs --check    → igual, y termina con error si falta algo (pruebas)
//   node scripts/i18n.mjs --missing en > falta.json  → claves sin traducir de un idioma
//
// Recoge:
//  · t("…") y msg("…") del código (src/, salvo el panel /admin, que es interno),
//  · los mensajes de error de las funciones de la base de datos (raise exception),
//    con %, %s… convertidos en {0}, {1}…
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const SKIP = [/\/app\/admin\//, /\/i18n\/(?!patterns\.ts)/];
const LOCALES = ["en", "fr", "de", "it", "pt"];

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mjs)$/.test(f) && !SKIP.some((r) => r.test(p))) out.push(p);
  }
  return out;
}

const LIT = String.raw`("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|\x60(?:[^\x60\\$]|\\.)*\x60)`;
const CALL = new RegExp(String.raw`(?<![\w.])(?:t|msg)\(\s*` + LIT, "g");

const TX = new RegExp(String.raw`<Tx(?:\s[^>]*)?>\s*(?:\{\s*` + LIT + String.raw`\s*\}|([^<{}]+?))\s*</Tx>`, "g");
const keys = new Map(); // clave → archivo (para localizarla)
for (const file of walk(SRC)) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(CALL)) {
    let text;
    try {
      text = Function(`"use strict"; return (${m[1]});`)();
    } catch {
      continue;
    }
    if (text && !keys.has(text)) keys.set(text, relative(ROOT, file));
  }
  for (const m of src.matchAll(TX)) {
    let text = m[2]?.trim();
    if (m[1]) {
      try {
        text = Function(`"use strict"; return (${m[1]});`)();
      } catch {
        continue;
      }
    }
    if (text && !keys.has(text)) keys.set(text, relative(ROOT, file));
  }
}

// Mensajes de la base de datos (la última definición de cada función es la que vale,
// pero incluir las antiguas no molesta: solo se usan si aparecen)
const MIG = join(ROOT, "supabase/migrations");
for (const f of readdirSync(MIG).sort()) {
  const sql = readFileSync(join(MIG, f), "utf8");
  for (const m of sql.matchAll(/raise exception\s+'((?:[^']|'')+)'/gi)) {
    let i = 0;
    const text = m[1].replace(/''/g, "'").replace(/%s?/g, () => `{${i++}}`);
    if (/[a-záéíóúñ]{3}/i.test(text) && !/^[a-z_]+$/.test(text) && !keys.has(text)) keys.set(text, `supabase/migrations/${f}`);
  }
}

const all = [...keys.keys()].sort((a, b) => a.localeCompare(b, "es"));
writeFileSync(join(ROOT, "src/i18n/keys.json"), JSON.stringify(all, null, 0).replace(/","/g, '",\n"') + "\n");

const args = process.argv.slice(2);
if (args[0] === "--missing") {
  const l = args[1];
  const dict = JSON.parse(readFileSync(join(ROOT, `src/i18n/messages/${l}.json`), "utf8"));
  const out = {};
  for (const k of all) if (!(k in dict)) out[k] = "";
  process.stdout.write(JSON.stringify(out, null, 1) + "\n");
  process.exit(0);
}

let missingTotal = 0;
for (const l of LOCALES) {
  const dict = JSON.parse(readFileSync(join(ROOT, `src/i18n/messages/${l}.json`), "utf8"));
  const missing = all.filter((k) => !(k in dict));
  const unused = Object.keys(dict).filter((k) => !keys.has(k));
  // Las variables {nombre} deben estar también en la traducción
  const badVars = all.filter((k) => k in dict && (k.match(/\{\w+\}/g) ?? []).some((v) => !dict[k].includes(v)));
  missingTotal += missing.length + badVars.length;
  console.log(`${l}: ${all.length - missing.length}/${all.length} traducidas${missing.length ? `, faltan ${missing.length}` : ""}${unused.length ? `, ${unused.length} sin usar` : ""}${badVars.length ? `, ${badVars.length} con variables mal` : ""}`);
  if (args[0] === "--check") for (const k of badVars) console.log(`   variables: ${l} «${k}»`);
}
if (args[0] === "--check" && missingTotal) process.exit(1);
