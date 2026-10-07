import { describe, expect, it } from "vitest";
import { changedFields } from "./diff";

describe("changedFields", () => {
  it("keeps only the fields that changed", () => {
    expect(changedFields({ score: 15, max: 20, note: "a" }, { score: 18, max: 20, note: "a" })).toEqual({
      before: { score: 15 },
      after: { score: 18 },
    });
  });

  it("records added and removed fields as null on the missing side", () => {
    expect(changedFields({ a: 1 }, { b: 2 })).toEqual({ before: { a: 1, b: null }, after: { a: null, b: 2 } });
  });

  it("compares dates and nested objects by value", () => {
    const d = new Date("2026-10-07T00:00:00Z");
    expect(changedFields({ at: d, x: { y: 1 } }, { at: new Date(d), x: { y: 1 } })).toEqual({ before: {}, after: {} });
  });

  it("passes through creates (no before) and deletes/archives (no after) unchanged", () => {
    expect(changedFields(null, { a: 1 })).toEqual({ before: null, after: { a: 1 } });
    expect(changedFields({ a: 1 }, null)).toEqual({ before: { a: 1 }, after: null });
  });
});
