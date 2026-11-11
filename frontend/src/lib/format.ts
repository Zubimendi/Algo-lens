import type { TypedValue } from "./trace-types";

export function plainFromTyped(v: TypedValue | undefined): unknown {
  if (!v) return undefined;
  switch (v.type) {
    case "int":
    case "float":
    case "bool":
    case "str":
    case "none":
      return v.value;
    case "list":
    case "tuple":
    case "set":
    case "stack":
    case "queue":
    case "heap":
      return Array.isArray(v.value)
        ? (v.value as TypedValue[]).map((x) => plainFromTyped(x))
        : v.value;
    case "matrix":
      return Array.isArray(v.value)
        ? (v.value as TypedValue[][]).map((row) =>
            Array.isArray(row) ? row.map((c) => plainFromTyped(c)) : row,
          )
        : v.value;
    case "dict":
      if (!Array.isArray(v.value)) return v.value;
      return Object.fromEntries(
        (v.value as { key: TypedValue; value: TypedValue }[]).map((p) => [
          String(plainFromTyped(p.key)),
          plainFromTyped(p.value),
        ]),
      );
    case "linked_list":
      if (!Array.isArray(v.value)) return v.value;
      return (v.value as { val: TypedValue }[]).map((n) => plainFromTyped(n.val));
    case "tree":
      if (!Array.isArray(v.value)) return v.value;
      return (v.value as ({ val: TypedValue } | null)[]).map((n) =>
        n == null ? null : plainFromTyped(n.val),
      );
    default:
      return v.value;
  }
}

export function formatValue(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const POINTER_NAMES = new Set([
  "i",
  "j",
  "k",
  "left",
  "right",
  "lo",
  "hi",
  "start",
  "end",
  "slow",
  "fast",
  "prev",
  "curr",
  "cur",
  "dummy",
  "r",
  "c",
  "row",
  "col",
]);
