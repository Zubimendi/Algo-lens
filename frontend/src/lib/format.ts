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

/** Unwrap accidental typed payloads that leaked into change.before/after. */
export function coercePlain(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "type" in value &&
    "value" in value
  ) {
    return plainFromTyped(value as TypedValue);
  }
  return value;
}

export function formatValue(value: unknown): string {
  const plain = coercePlain(value);
  if (typeof plain === "string") return JSON.stringify(plain);
  try {
    return JSON.stringify(plain);
  } catch {
    return String(plain);
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
