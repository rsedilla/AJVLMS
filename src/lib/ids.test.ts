import { describe, expect, it } from "vitest";
import { isUuid, uuidv7 } from "./ids";

describe("uuidv7", () => {
  it("produces a valid version-7 UUID", () => {
    const id = uuidv7();
    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe("7"); // version nibble
    expect("89ab").toContain(id[19]); // variant nibble
  });

  it("encodes the timestamp in the first 48 bits", () => {
    const now = Date.UTC(2026, 9, 7, 12, 0, 0); // 2026-10-07T12:00:00Z
    const id = uuidv7(now);
    const ms = parseInt(id.replace(/-/g, "").slice(0, 12), 16);
    expect(ms).toBe(now);
  });

  it("sorts by creation time across milliseconds", () => {
    const ids = [3, 1, 2].map((offset) => uuidv7(1_800_000_000_000 + offset));
    expect([...ids].sort()).toEqual([ids[1], ids[2], ids[0]]);
  });

  it("is unique (random part)", () => {
    const now = Date.now();
    const ids = new Set(Array.from({ length: 1000 }, () => uuidv7(now)));
    expect(ids.size).toBe(1000);
  });
});

describe("isUuid", () => {
  it("rejects non-UUIDs", () => {
    for (const bad of ["", "abc", "2099-0001", null, 42, "00000000-0000-0000-0000-000000000000"]) {
      expect(isUuid(bad)).toBe(false);
    }
  });
});
