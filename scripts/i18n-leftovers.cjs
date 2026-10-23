// Busca textos en español que aún no pasan por t()/msg().
//   node scripts/i18n-leftovers.cjs archivo… → archivo:línea  «texto»
const ts = require("typescript");
const fs = require("fs");

const SPANISH = /[áéíóúñ¿¡]|\b(el|la|los|las|de|del|que|con|para|por|sin|una?|tu|tus|ya|no|se|al|en|es|y|o|más|hay|está|este|esta|aquí|ventas?|productos?|pedidos?|fecha|guardar|cancelar|borrar|nuevo|nueva|todos?|todas?)\b/i;
const SKIP_ATTRS = new Set(["className", "href", "src", "type", "name", "id", "key", "variant", "tone", "size", "role", "rel", "target", "method", "action", "autoComplete", "inputMode", "pattern", "accept", "htmlFor", "form", "data-bubble", "aria-controls", "aria-current", "aria-haspopup", "enterKeyHint", "lang", "dir", "encType", "sizes", "media", "as", "prefetch", "scroll", "replace", "d", "viewBox", "fill", "stroke"]);

function check(file) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = [];
  const inCall = (n) => {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && ["t", "msg", "tr", "require"].includes(p.expression.text)) return true;
      if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && ["log", "error", "warn", "info", "debug", "from", "rpc", "select", "eq", "order", "in", "is", "ilike", "match", "storage", "upload", "remove", "get", "set", "delete", "append", "has", "startsWith", "endsWith", "includes", "replace", "split", "test", "padStart"].includes(p.expression.name.text)) return true;
      if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return true;
      if (ts.isJsxAttribute(p) && SKIP_ATTRS.has(p.name.getText(sf))) return true;
      if (ts.isPropertyAssignment(p) && p.name === n) return true;
      if (ts.isBinaryExpression(p) && ["===", "!==", "==", "!="].includes(p.operatorToken.getText(sf))) return true;
      if (ts.isCaseClause(p) && p.expression === n) return true;
      if (ts.isLiteralTypeNode(p) || ts.isTypeNode(p)) return true;
      if (ts.isFunctionLike(p) || ts.isBlock(p) || ts.isSourceFile(p)) return false;
    }
    return false;
  };
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) {
      const text = ts.isTemplateExpression(n) ? n.getText(sf).slice(1, -1) : n.text;
      if (/[A-Za-zÁ-ú]{2,}/.test(text) && SPANISH.test(text) && !/^[a-z_\-.\/:]+$/.test(text) && !/^(bg|text|border|flex|grid|rounded|px|py|p-|m-|w-|h-|min-|max-)/.test(text) && !text.includes("className") && !inCall(n)) {
        const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
        out.push(`${file}:${line + 1}\t${text.slice(0, 110)}`);
      }
      return;
    }
    if (ts.isJsxText(n) && /[A-Za-zÁ-ú]{2,}/.test(n.text)) {
      const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
      out.push(`${file}:${line + 1}\tJSX: ${n.text.trim().slice(0, 110)}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

for (const f of process.argv.slice(2)) for (const l of check(f)) console.log(l);
