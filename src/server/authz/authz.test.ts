import { describe, expect, it } from "vitest";
import { assertCan, hasRole, NotFoundError, type Actor } from "./index";

const actor = (...roles: Actor["roles"] extends ReadonlySet<infer R> ? R[] : never): Actor => ({
  userId: "u-1",
  roles: new Set(roles),
});

describe("hasRole", () => {
  it("is true when the actor holds any of the given roles", () => {
    expect(hasRole(actor("staff", "parent"), "parent")).toBe(true);
    expect(hasRole(actor("staff"), "admin", "staff")).toBe(true);
  });

  it("is false when the actor holds none of them", () => {
    expect(hasRole(actor("student"), "admin", "staff")).toBe(false);
  });

  it("is false for an actor with no roles (deny by default)", () => {
    expect(hasRole(actor(), "student")).toBe(false);
  });
});

describe("assertCan", () => {
  it("passes when allowed", () => {
    expect(() => assertCan(true)).not.toThrow();
  });

  it("throws NotFoundError when denied, so callers can't tell the resource exists (A5)", () => {
    expect(() => assertCan(false)).toThrow(NotFoundError);
  });
});
