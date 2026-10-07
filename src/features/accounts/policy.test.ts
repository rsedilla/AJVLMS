import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/roles";
import type { Actor } from "@/server/authz";
import { canReadRoles } from "./policy";

const as = (userId: string, ...roles: Role[]): Actor => ({ userId, roles: new Set(roles) });

describe("canReadRoles", () => {
  describe("allowed", () => {
    it("a user may read their own roles", () => {
      expect(canReadRoles(as("student-1", "student"), "student-1")).toBe(true);
    });
    it("a user with no roles may still read their own (empty) roles", () => {
      expect(canReadRoles(as("new-user"), "new-user")).toBe(true);
    });
    it("an admin may read anyone's roles", () => {
      expect(canReadRoles(as("admin-1", "admin"), "student-1")).toBe(true);
    });
  });

  describe("denied", () => {
    it("a student may not read another student's roles", () => {
      expect(canReadRoles(as("student-1", "student"), "student-2")).toBe(false);
    });
    it("a parent may not read other users' roles", () => {
      expect(canReadRoles(as("parent-1", "parent"), "student-1")).toBe(false);
    });
    it("staff may not read other users' roles", () => {
      expect(canReadRoles(as("staff-1", "staff"), "student-1")).toBe(false);
    });
    it("the principal (read-only on grades) may not read other users' roles", () => {
      expect(canReadRoles(as("principal-1", "principal"), "student-1")).toBe(false);
    });
  });
});
