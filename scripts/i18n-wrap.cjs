// Convertidor de una sola vez: marca los textos visibles para traducirlos.
//   node scripts/i18n-wrap.cjs archivo.tsx [...]
// - Texto JSX (con sus {variables} en medio) → {t("Hay {n} ventas", { n })}
// - Atributos de texto (title, placeholder, aria-label…) → {t("…")}
// - Cadenas que se pintan ({cond ? "Sí" : "No"}) → t("…")
// - Propiedades label/title/description/error/message… → t("…") o msg("…") fuera de funciones
// Después añade `const t = …` donde haga falta. Lo que no sabe resolver lo
// detecta el comprobador de tipos.
const ts = require("typescript");
const fs = require("fs");

const ATTRS = new Set(["title", "placeholder", "aria-label", "alt", "label", "description", "hint", "note", "error", "emptyLabel", "confirmLabel", "confirmText", "subtitle", "summary", "heading", "caption", "legend", "message", "help", "empty", "aria-description", "ariaLabel", "cancelLabel", "okLabel", "pendingLabel", "doneLabel", "question"]);
const PROPS = new Set(["label", "title", "description", "error", "message", "hint", "note", "placeholder", "unavailable", "summary", "text", "help", "question", "answer", "empty", "confirm", "tooltip", "reason", "detail", "subtitle", "heading", "caption", "q", "a", "alt"]);

const letters = (s) => /[A-Za-zÁÉÍÓÚáéíóúÑñüÜ¿¡]{2,}/.test(s);
const looksCode = (s) => /^[a-z0-9_\-./:#?=&]+$/.test(s) && !/\s/.test(s) && !/[áéíóúñ]/.test(s);

function varName(expr, sf, used) {
  let base = "v";
  let e = expr;
  while (e) {
    if (ts.isIdentifier(e)) { base = e.text; break; }
    if (ts.isPropertyAccessExpression(e)) { base = e.name.text; break; }
    if (ts.isCallExpression(e)) { e = e.arguments[0] ?? e.expression; continue; }
    if (ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e) || ts.isAsExpression(e)) { e = e.expression; continue; }
    if (ts.isElementAccessExpression(e)) { e = e.expression; continue; }
    if (ts.isConditionalExpression(e) || ts.isBinaryExpression(e)) { base = "v"; break; }
    break;
  }
  base = base.replace(/[^A-Za-z0-9_]/g, "") || "v";
  let n = base, i = 2;
  while (used.has(n)) n = base + i++;
  used.add(n);
  return n;
}

// Texto JSX tal como se pinta (reglas de espacios de JSX)
function jsxTextValue(raw) {
  if (!raw.includes("\n")) return raw;
  const lines = raw.split("\n");
  const out = [];
  lines.forEach((l, i) => {
    let s = l.replace(/\t/g, " ");
    if (i > 0) s = s.replace(/^ +/, "");
    if (i < lines.length - 1) s = s.replace(/ +$/, "");
    if (s) out.push(s);
  });
  return out.join(" ");
}

const q = (s) => JSON.stringify(s);

function isSimpleExpr(e) {
  if (!e) return false;
  if (ts.isJsxElement(e) || ts.isJsxSelfClosingElement(e) || ts.isJsxFragment(e)) return false;
  if (ts.isConditionalExpression(e) || (ts.isBinaryExpression(e) && ["&&", "||", "??"].includes(e.operatorToken.getText()))) return false;
  if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) return false;
  // .map(...) que devuelve JSX, etc.
  let hasJsx = false;
  const walk = (n) => { if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) hasJsx = true; else ts.forEachChild(n, walk); };
  walk(e);
  return !hasJsx;
}

function processFile(file) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = []; // {start,end,text}
  const isClient = /^\s*["']use client["']/.test(src);
  const touched = new Set(); // nodos que ya se han convertido

  const insideFunction = (n) => {
    for (let p = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) return true;
    return false;
  };
  const fn = (n) => (insideFunction(n) ? "t" : "msg");

  // Cadena o plantilla → llamada t(...)
  function literalCall(node, f) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!letters(node.text) || looksCode(node.text)) return null;
      return `${f}(${q(node.text)})`;
    }
    if (ts.isTemplateExpression(node) && f === "t") {
      const used = new Set();
      let key = node.head.text;
      const vars = [];
      for (const span of node.templateSpans) {
        const name = varName(span.expression, sf, used);
        key += `{${name}}` + span.literal.text;
        const exprText = span.expression.getText(sf);
        vars.push(name === exprText ? name : `${name}: ${exprText}`);
      }
      if (!letters(key.replace(/\{\w+\}/g, ""))) return null;
      return `t(${q(key)}, { ${vars.join(", ")} })`;
    }
    return null;
  }

  // Cadenas en posiciones que se pintan dentro de {…}
  function wrapRendered(e, f) {
    if (!e) return;
    if (ts.isParenthesizedExpression(e)) return wrapRendered(e.expression, f);
    if (ts.isConditionalExpression(e)) { wrapRendered(e.whenTrue, f); wrapRendered(e.whenFalse, f); return; }
    if (ts.isBinaryExpression(e) && ["&&", "||", "??"].includes(e.operatorToken.getText())) { wrapRendered(e.right, f); if (e.operatorToken.getText() !== "&&") wrapRendered(e.left, f); return; }
    const c = literalCall(e, f);
    if (c) { edits.push({ start: e.getStart(sf), end: e.getEnd(), text: c }); touched.add(e); }
  }

  function processChildren(children) {
    // Tramos de texto + expresiones simples
    let run = [];
    const flush = () => {
      const hasText = run.some((c) => ts.isJsxText(c) && letters(c.text));
      if (hasText) {
        const used = new Set();
        let key = "";
        const vars = [];
        for (const c of run) {
          if (ts.isJsxText(c)) key += jsxTextValue(c.text);
          else {
            const e = c.expression;
            const name = varName(e, sf, used);
            key += `{${name}}`;
            const et = e.getText(sf);
            vars.push(name === et ? name : `${name}: ${et}`);
          }
        }
        const lead = key.match(/^\s*/)[0];
        const trail = key.match(/\s*$/)[0];
        const core = key.trim();
        const start = run[0].getStart(sf, false) ;
        const s0 = ts.isJsxText(run[0]) ? run[0].pos : run[0].getStart(sf);
        const end = run[run.length - 1].getEnd();
        // Espacio inicial/final significativo solo si el texto no empieza/acaba en salto de línea
        const firstRaw = ts.isJsxText(run[0]) ? run[0].text : "";
        const lastRaw = ts.isJsxText(run[run.length - 1]) ? run[run.length - 1].text : "";
        const keepLead = lead && !/^\s*\n/.test(firstRaw);
        const keepTrail = trail && !/\n\s*$/.test(lastRaw);
        let text = `{t(${q(core)}${vars.length ? `, { ${vars.join(", ")} }` : ""})}`;
        if (keepLead) text = `{" "}` + text;
        if (keepTrail) text = text + `{" "}`;
        // Conserva el sangrado original
        const indentMatch = firstRaw.match(/^\s*\n([ \t]*)/);
        const prefix = indentMatch ? "\n" + indentMatch[1] : "";
        const suffixMatch = lastRaw.match(/\n([ \t]*)$/);
        const suffix = suffixMatch ? "\n" + suffixMatch[1] : "";
        edits.push({ start: s0, end, text: prefix + text + suffix });
        void start;
      }
      run = [];
    };
    for (const c of children) {
      if (ts.isJsxText(c)) run.push(c);
      else if (ts.isJsxExpression(c) && c.expression && isSimpleExpr(c.expression) && !ts.isStringLiteral(c.expression) && run.length && ts.isJsxText(run[run.length - 1]) && letters(run[run.length - 1].text)) run.push(c);
      else if (ts.isJsxExpression(c) && c.expression && isSimpleExpr(c.expression) && !ts.isStringLiteral(c.expression) && run.length === 0) {
        // Expresión al principio: solo entra si le sigue texto en la misma línea
        run.push(c);
      } else {
        // Tramo cerrado. Las expresiones sueltas sin texto no se tocan
        while (run.length && !ts.isJsxText(run[run.length - 1])) run.pop();
        flush();
        if (ts.isJsxExpression(c) && c.expression) wrapRendered(c.expression, "t");
      }
    }
    while (run.length && !ts.isJsxText(run[run.length - 1])) run.pop();
    // Quita expresiones iniciales que no van seguidas de texto con letras
    while (run.length && !ts.isJsxText(run[0]) && !(run[1] && ts.isJsxText(run[1]) && !/^\s*\n/.test(run[1].text))) run.shift();
    flush();
  }

  function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      processChildren(node.children);
    }
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sf);
      if (ATTRS.has(name) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          const c = literalCall(node.initializer, "t");
          if (c) edits.push({ start: node.initializer.getStart(sf), end: node.initializer.getEnd(), text: `{${c}}` });
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          wrapRendered(node.initializer.expression, "t");
        }
      }
    }
    if (ts.isPropertyAssignment(node) && PROPS.has(node.name.getText(sf).replace(/["']/g, ""))) {
      const f = fn(node);
      const init = node.initializer;
      if (!touched.has(init)) {
        if (ts.isConditionalExpression(init) || ts.isBinaryExpression(init) || ts.isParenthesizedExpression(init)) wrapRendered(init, f);
        else {
          const c = literalCall(init, f);
          if (c) edits.push({ start: init.getStart(sf), end: init.getEnd(), text: c });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (!edits.length) return { file, changed: false };

  // Aplica de atrás hacia delante, sin solapes (gana la más externa)
  edits.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept = [];
  let lastEnd = -1;
  for (const e of edits) {
    if (e.start < lastEnd) continue;
    kept.push(e);
    lastEnd = e.end;
  }
  let out = src;
  for (const e of kept.reverse()) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  out = addDeclarations(out, file, isClient);
  fs.writeFileSync(file, out);
  return { file, changed: true, n: kept.length };
}

// Añade const t = … en la función más externa que usa t y no lo tiene
function addDeclarations(src, file, isClient) {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const usesT = (n) => {
    let found = false;
    const w = (x) => {
      if (found) return;
      if (ts.isCallExpression(x) && ts.isIdentifier(x.expression) && x.expression.text === "t") found = true;
      else ts.forEachChild(x, w);
    };
    w(n);
    return found;
  };
  const declaresT = (body) => /\bconst t = /.test(body.getText(sf)) || false;
  const inserts = [];
  const isComponentName = (n) => !!n && /^[A-Z]/.test(n);
  function nameOf(f) {
    if (f.name && ts.isIdentifier(f.name)) return f.name.text;
    if (f.parent && ts.isVariableDeclaration(f.parent) && ts.isIdentifier(f.parent.name)) return f.parent.name.text;
    return null;
  }
  function visit(node, covered) {
    if (ts.isFunctionLike(node) && node.body && !covered && usesT(node.body)) {
      const name = nameOf(node);
      const isAsync = (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) !== 0 || (node.modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
      const isDefault = (node.modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
      const params = node.parameters.map((p) => p.name.getText(sf));
      if (params.includes("t")) return ts.forEachChild(node, (c) => visit(c, true));
      let decl = null;
      if (isClient) {
        if (isComponentName(name) || isDefault) decl = "const t = useT();";
      } else {
        decl = isAsync ? "const t = await getT();" : "const t = tSync();";
      }
      if (decl) {
        if (ts.isBlock(node.body)) {
          if (!declaresT(node.body)) inserts.push({ pos: node.body.getStart(sf) + 1, text: `\n  ${decl}` });
        } else {
          // Cuerpo de expresión → bloque con return
          inserts.push({ pos: node.body.getStart(sf), text: `{\n  ${decl}\n  return (`, end: true });
          inserts.push({ pos: node.body.getEnd(), text: `);\n}` });
        }
        return ts.forEachChild(node, (c) => visit(c, true));
      }
    }
    ts.forEachChild(node, (c) => visit(c, covered));
  }
  visit(sf, false);
  inserts.sort((a, b) => b.pos - a.pos);
  let out = src;
  for (const i of inserts) out = out.slice(0, i.pos) + i.text + out.slice(i.pos);

  // Importaciones
  const need = [];
  if (/\bmsg\(/.test(out) && !/import \{[^}]*\bmsg\b[^}]*\} from "@\/i18n\/translate"/.test(out)) need.push(`import { msg } from "@/i18n/translate";`);
  if (/useT\(\)/.test(out) && !/\buseT\b[^;]*from "@\/i18n\/client"/.test(out)) need.push(`import { useT } from "@/i18n/client";`);
  const server = [];
  if (/await getT\(\)/.test(out) && !/\bgetT\b[^;]*from "@\/i18n\/server"/.test(out)) server.push("getT");
  if (/tSync\(\)/.test(out) && !/\btSync\b[^;]*from "@\/i18n\/server"/.test(out)) server.push("tSync");
  if (server.length) need.push(`import { ${server.join(", ")} } from "@/i18n/server";`);
  if (need.length) {
    // Después de la directiva "use client"/"use server" y del comentario inicial
    const m = out.match(/^(\s*(?:["']use (?:client|server)["'];?\s*\n)?(?:\/\*[\s\S]*?\*\/\s*\n|(?:\/\/[^\n]*\n))*)/);
    const at = m ? m[0].length : 0;
    out = out.slice(0, at) + need.join("\n") + "\n" + out.slice(at);
  }
  return out;
}

const results = process.argv.slice(2).map(processFile);
for (const r of results) if (r.changed) console.log(`${r.n}\t${r.file}`);
