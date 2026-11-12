import { coercePlain, formatValue, plainFromTyped } from "./format";
import type { Change, Step, TypedValue } from "./trace-types";

export type StepInsight = {
  headline: string;
  detail: string;
  reads: { label: string; value: string }[];
  writes: { label: string; value: string }[];
};

/** Build a plain-English “what this step means” from the line + live locals. */
export function buildStepInsight(
  lineText: string,
  locals: Record<string, TypedValue>,
  changes: Change[],
): StepInsight | null {
  const plain: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(locals)) {
    plain[k] = plainFromTyped(v);
  }

  const src = lineText.trim();
  if (!src) return null;

  const reads: { label: string; value: string }[] = [];
  const writes: { label: string; value: string }[] = [];
  const focusNames = new Set<string>();

  // Index reads: name[i], name[j]
  const indexRe =
    /\b([A-Za-z_][A-Za-z0-9_]*)\s*\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]/g;
  let m: RegExpExecArray | null;
  const seenRead = new Set<string>();
  while ((m = indexRe.exec(src))) {
    const arr = m[1];
    const idxName = m[2];
    const key = `${arr}[${idxName}]`;
    if (seenRead.has(key)) continue;
    seenRead.add(key);
    focusNames.add(arr);
    focusNames.add(idxName);
    const arrVal = plain[arr];
    const idx = plain[idxName];
    if (Array.isArray(arrVal) && typeof idx === "number" && idx in arrVal) {
      reads.push({
        label: key,
        value: `${formatValue(arrVal[idx])}  (because ${idxName}=${idx})`,
      });
    }
  }

  let headline = `Running: ${src}`;
  let detail = "";

  if (/==/.test(src) && reads.length >= 2) {
    const nums = reads
      .map((r) => {
        try {
          return JSON.parse(r.value.split(" ")[0] ?? "");
        } catch {
          return null;
        }
      })
      .filter((n): n is number => typeof n === "number");
    if (nums.length >= 2 && "target" in plain) {
      focusNames.add("target");
      const sum = nums[0] + nums[1];
      const target = plain.target;
      const ok = sum === target;
      headline = `Check: ${nums[0]} + ${nums[1]} = ${sum} ${ok ? "==" : "!="} target ${formatValue(target)}`;
      detail = ok
        ? "Condition is true — the body runs next."
        : "Condition is false — this pair is skipped.";
      reads.push({ label: "target", value: formatValue(target) });
    } else {
      headline = "Comparing values from the line";
      detail = src;
    }
  }

  const append = /\.append\s*\((.+)\)\s*$/.exec(src);
  if (append) {
    const expr = append[1].trim();
    const listMatch = /^([A-Za-z_][\w]*)\s*\.append/.exec(src);
    if (listMatch) focusNames.add(listMatch[1]);
    const evaluated = evalSimple(expr, plain);
    headline = `Append ${expr}`;
    detail =
      evaluated !== undefined
        ? `Pushes ${formatValue(evaluated)} onto the list.`
        : "Grows the list by one element.";
    if (evaluated !== undefined) {
      writes.push({ label: "appended", value: formatValue(evaluated) });
    }
  }

  const assign = /^([A-Za-z_][\w]*)\s*=\s*(.+)$/.exec(src);
  if (assign && !src.includes("==") && !src.includes("!=")) {
    const name = assign[1];
    focusNames.add(name);
    const change = changes.find((c) => c.name === name);
    const shown = coercePlain(
      change?.after !== undefined && change.after !== null
        ? change.after
        : evalSimple(assign[2], plain),
    );
    headline = `Set ${name}`;
    detail =
      shown !== undefined
        ? `${name} becomes ${formatValue(shown)}.`
        : `Updating ${name}.`;
    if (shown !== undefined) {
      writes.push({ label: name, value: formatValue(shown) });
    }
  }

  if (src.startsWith("return ")) {
    const expr = src.slice("return ".length);
    const evaluated = evalSimple(expr, plain);
    headline = "Return the answer";
    detail =
      evaluated !== undefined
        ? `Returning ${formatValue(evaluated)}.`
        : "Handing the result back to the caller.";
    if (evaluated !== undefined) {
      writes.push({ label: "return", value: formatValue(evaluated) });
    }
  }

  if (/^break\b/.test(src)) {
    headline = "Break the inner loop";
    detail =
      "Only the innermost loop stops. An outer loop can still continue and append more values.";
  }

  if (/^continue\b/.test(src)) {
    headline = "Continue to the next iteration";
    detail = "Skip the rest of this loop body.";
  }

  // Only add change rows that match this line's focus (avoid dumping every local)
  for (const c of changes) {
    if (c.kind !== "changed" && c.kind !== "added") continue;
    if (focusNames.size > 0 && !focusNames.has(c.name)) continue;
    if (writes.some((w) => w.label === c.name)) continue;
    // Skip huge first-frame "added" noise for params when we're setting something else
    if (c.kind === "added" && focusNames.size > 0 && !focusNames.has(c.name)) {
      continue;
    }
    const before = coercePlain(c.before);
    const after = coercePlain(c.after);
    writes.push({
      label: c.name,
      value:
        c.kind === "changed"
          ? `${formatValue(before)} → ${formatValue(after)}`
          : formatValue(after),
    });
  }

  // Reads: only names mentioned on the line (or index helpers), never random params
  if (reads.length === 0) {
    for (const name of extractNames(src)) {
      if (name in plain && !["True", "False", "None", "len"].includes(name)) {
        reads.push({ label: name, value: formatValue(plain[name]) });
      }
    }
  }

  // Deduplicate reads by label
  const readSeen = new Set<string>();
  const cleanReads = reads.filter((r) => {
    if (readSeen.has(r.label)) return false;
    readSeen.add(r.label);
    return true;
  });

  return {
    headline,
    detail,
    reads: cleanReads.slice(0, 6),
    writes: writes.slice(0, 4),
  };
}

function extractNames(src: string): string[] {
  const out: string[] = [];
  const re = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let m: RegExpExecArray | null;
  const skip = new Set([
    "and",
    "or",
    "not",
    "in",
    "is",
    "if",
    "else",
    "for",
    "while",
    "return",
    "break",
    "continue",
    "True",
    "False",
    "None",
    "len",
    "range",
    "append",
  ]);
  while ((m = re.exec(src))) {
    if (!skip.has(m[1])) out.push(m[1]);
  }
  return out;
}

function evalSimple(expr: string, plain: Record<string, unknown>): unknown {
  const e = expr.trim();
  if (e in plain) return plain[e];

  const idx = /^([A-Za-z_][\w]*)\s*\[\s*([A-Za-z_][\w]*|\d+)\s*\]$/.exec(e);
  if (idx) {
    const arr = plain[idx[1]];
    const i = /^\d+$/.test(idx[2]) ? Number(idx[2]) : (plain[idx[2]] as number);
    if (Array.isArray(arr) && typeof i === "number") return arr[i];
  }

  const add = /^([A-Za-z_][\w]*)\s*([+-])\s*(\d+)$/.exec(e);
  if (add && typeof plain[add[1]] === "number") {
    const n = plain[add[1]] as number;
    return add[2] === "+" ? n + Number(add[3]) : n - Number(add[3]);
  }

  const lenM = /^len\(\s*([A-Za-z_][\w]*)\s*\)$/.exec(e);
  if (lenM) {
    const v = plain[lenM[1]];
    if (Array.isArray(v) || typeof v === "string") return v.length;
  }

  try {
    const fn = new Function(
      ...Object.keys(plain),
      `"use strict"; return (${e});`,
    );
    return fn(...Object.values(plain));
  } catch {
    return undefined;
  }
}

export function pointersForArray(
  arrayName: string,
  length: number,
  allPointers: Record<string, number>,
): Record<string, number> {
  const primary =
    /^(nums?|numbers|arr|array|words|haystack|prices|height|candidates|list|data)$/i.test(
      arrayName,
    );
  const out: Record<string, number> = {};
  for (const [name, idx] of Object.entries(allPointers)) {
    if (idx < 0 || idx >= length) continue;
    if (primary) out[name] = idx;
  }
  if (/^(result|ans|answer|output|res|out)$/i.test(arrayName)) {
    return {};
  }
  if (!primary && Object.keys(out).length === 0) {
    if (/stack|queue|heap|dp|seen|count/i.test(arrayName)) return {};
    for (const [name, idx] of Object.entries(allPointers)) {
      if (idx >= 0 && idx < length) out[name] = idx;
    }
  }
  return out;
}

export function changedListIndices(
  name: string,
  changes: Change[],
): Set<number> {
  const set = new Set<number>();
  for (const c of changes) {
    if (c.name !== name) continue;
    const before = coercePlain(c.before);
    const after = coercePlain(c.after);
    if (Array.isArray(before) && Array.isArray(after)) {
      if (after.length > before.length) {
        set.add(after.length - 1);
      } else {
        const n = Math.min(before.length, after.length);
        for (let i = 0; i < n; i++) {
          if (JSON.stringify(before[i]) !== JSON.stringify(after[i])) {
            set.add(i);
          }
        }
      }
    } else if (Array.isArray(after) && c.kind === "added") {
      for (let i = 0; i < after.length; i++) set.add(i);
    }
  }
  return set;
}

export function stepLocals(step: Step): Record<string, TypedValue> {
  return step.locals;
}
