// Shallow "what changed" helper for audit entries: keeps only fields whose values differ.

type Plain = Record<string, unknown>;

const same = (a: unknown, b: unknown): boolean => {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return Object.is(a, b);
};

/** Returns only the changed fields: `{ before: {field: old}, after: {field: new} }`. */
export function changedFields(before: Plain | null, after: Plain | null): { before: Plain | null; after: Plain | null } {
  if (!before || !after) return { before, after };
  const b: Plain = {};
  const a: Plain = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!same(before[key], after[key])) {
      b[key] = before[key] ?? null;
      a[key] = after[key] ?? null;
    }
  }
  return { before: b, after: a };
}
