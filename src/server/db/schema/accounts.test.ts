import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { ROLES, isRole } from "@/lib/roles";
import { userRole } from "./accounts";

describe("user_role schema", () => {
  it("the CHECK constraint allows exactly the roles in src/lib/roles.ts", () => {
    const source = readFileSync(new URL("./accounts.ts", import.meta.url), "utf8");
    const checkLine = source.split("\n").find((l) => l.includes("user_role_role_check"));
    const allowed = [...(checkLine ?? "").matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(allowed.sort()).toEqual([...ROLES].sort());
  });

  it("uses text + CHECK, not a pg enum (D4)", () => {
    const config = getTableConfig(userRole);
    expect(config.columns.find((c) => c.name === "role")?.getSQLType()).toBe("text");
    expect(config.checks.map((c) => c.name)).toContain("user_role_role_check");
  });

  it("isRole rejects the retired 'adviser' and 'teacher' roles (ADR 0005)", () => {
    expect(isRole("adviser")).toBe(false);
    expect(isRole("teacher")).toBe(false);
    expect(ROLES.every(isRole)).toBe(true);
  });
});
