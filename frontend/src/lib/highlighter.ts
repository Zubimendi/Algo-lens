import type { LanguageId } from "./languages";

export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "punct";

export type Token = { kind: TokenKind; text: string };

const PYTHON_KEYWORDS = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);

const C_LIKE_KEYWORDS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "interface",
  "let",
  "new",
  "null",
  "return",
  "static",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "public",
  "private",
  "protected",
  "package",
  "func",
  "defer",
  "go",
  "chan",
  "struct",
  "type",
  "map",
  "range",
]);

/**
 * Line highlighter that understands comments/strings per language family.
 * Designed so new languages plug in without rewriting the visualizer.
 */
export function highlightLine(line: string, language: LanguageId): Token[] {
  if (language === "python") {
    return highlightPython(line);
  }
  return highlightCFamily(line);
}

function highlightPython(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];

    // Full-line or trailing comment
    if (ch === "#") {
      tokens.push({ kind: "comment", text: line.slice(i) });
      break;
    }

    // Triple / single strings
    if (ch === "'" || ch === '"') {
      const triple = line.slice(i, i + 3);
      if (triple === '"""' || triple === "'''") {
        const end = line.indexOf(triple, i + 3);
        if (end === -1) {
          tokens.push({ kind: "string", text: line.slice(i) });
          break;
        }
        tokens.push({ kind: "string", text: line.slice(i, end + 3) });
        i = end + 3;
        continue;
      }
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          j += 1;
          break;
        }
        j += 1;
      }
      tokens.push({ kind: "string", text: line.slice(i, j) });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j += 1;
      const word = line.slice(i, j);
      tokens.push({
        kind: PYTHON_KEYWORDS.has(word) ? "keyword" : "plain",
        text: word,
      });
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[0-9_.]/.test(line[j])) j += 1;
      tokens.push({ kind: "number", text: line.slice(i, j) });
      i = j;
      continue;
    }

    if ("()[]{}:,.=<>+-*/%|&^!~".includes(ch)) {
      tokens.push({ kind: "punct", text: ch });
      i += 1;
      continue;
    }

    tokens.push({ kind: "plain", text: ch });
    i += 1;
  }
  return mergePlain(tokens);
}

function highlightCFamily(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === "/" && line[i + 1] === "/") {
      tokens.push({ kind: "comment", text: line.slice(i) });
      break;
    }
    if (ch === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);
      if (end === -1) {
        tokens.push({ kind: "comment", text: line.slice(i) });
        break;
      }
      tokens.push({ kind: "comment", text: line.slice(i, end + 2) });
      i = end + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          j += 1;
          break;
        }
        j += 1;
      }
      tokens.push({ kind: "string", text: line.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j += 1;
      const word = line.slice(i, j);
      tokens.push({
        kind: C_LIKE_KEYWORDS.has(word) ? "keyword" : "plain",
        text: word,
      });
      i = j;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[0-9_.]/.test(line[j])) j += 1;
      tokens.push({ kind: "number", text: line.slice(i, j) });
      i = j;
      continue;
    }
    tokens.push({ kind: "plain", text: ch });
    i += 1;
  }
  return mergePlain(tokens);
}

function mergePlain(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (const t of tokens) {
    const last = out[out.length - 1];
    if (last && last.kind === "plain" && t.kind === "plain") {
      last.text += t.text;
    } else {
      out.push({ ...t });
    }
  }
  return out;
}
