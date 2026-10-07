import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/roles";
import type { Actor } from "@/server/authz";
import { canReadAuditLog } from "./policy";

const as = (...roles: Role[]): Actor => ({ userId: "u", roles: new Set(roles) });

describe("canReadAuditLog", () => {
  it.each<Role>(["principal", "admin"])("allows %s", (role) => expect(canReadAuditLog(as(role))).toBe(true));
  it.each<Role>(["student", "parent", "staff"])("denies %s", (role) => expect(canReadAuditLog(as(role))).toBe(false));
  it("denies staff who are also parents", () => expect(canReadAuditLog(as("staff", "parent"))).toBe(false));
  it("denies no role", () => expect(canReadAuditLog(as())).toBe(false));
});
