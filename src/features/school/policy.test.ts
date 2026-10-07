import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/roles";
import type { Actor } from "@/server/authz";
import {
  canListOwnAdvisorySections,
  canListSections,
  canLookUpEnrollments,
  canReadEnrollment,
  canReadSchoolCalendar,
} from "./policy";

const as = (userId: string, ...roles: Role[]): Actor => ({ userId, roles: new Set(roles) });

describe("canReadSchoolCalendar (years, terms, grade levels)", () => {
  it.each<Role>(["student", "parent", "staff", "principal", "admin"])("allows %s", (role) => {
    expect(canReadSchoolCalendar(as("u", role))).toBe(true);
  });
  it("denies a signed-in user with no role", () => {
    expect(canReadSchoolCalendar(as("u"))).toBe(false);
  });
});

describe("canListSections", () => {
  it.each<Role>(["staff", "principal", "admin"])("allows %s", (role) => {
    expect(canListSections(as("u", role))).toBe(true);
  });
  it.each<Role>(["student", "parent"])("denies %s", (role) => {
    expect(canListSections(as("u", role))).toBe(false);
  });
  it("denies no role", () => expect(canListSections(as("u"))).toBe(false));
});

describe("canLookUpEnrollments (up-front gate)", () => {
  it.each<Role>(["student", "staff", "principal", "admin"])("allows %s", (role) => {
    expect(canLookUpEnrollments(as("u", role))).toBe(true);
  });
  it("denies parent (until guardians exist)", () => expect(canLookUpEnrollments(as("u", "parent"))).toBe(false));
  it("denies no role", () => expect(canLookUpEnrollments(as("u"))).toBe(false));
});

describe("canReadEnrollment", () => {
  const enrollment = { studentId: "student-1", adviserIds: ["adviser-1"] };

  describe("allowed", () => {
    it("the student themself", () => expect(canReadEnrollment(as("student-1", "student"), enrollment)).toBe(true));
    it("the section's adviser", () => expect(canReadEnrollment(as("adviser-1", "staff"), enrollment)).toBe(true));
    it("the principal", () => expect(canReadEnrollment(as("p-1", "principal"), enrollment)).toBe(true));
    it("an admin", () => expect(canReadEnrollment(as("a-1", "admin"), enrollment)).toBe(true));
  });

  describe("denied", () => {
    it("another student", () => expect(canReadEnrollment(as("student-2", "student"), enrollment)).toBe(false));
    it("staff who don't advise this section", () =>
      expect(canReadEnrollment(as("staff-9", "staff"), enrollment)).toBe(false));
    it("a parent (until the guardians feature links them to a child)", () =>
      expect(canReadEnrollment(as("parent-1", "parent"), enrollment)).toBe(false));
    it("an adviser id that no longer holds the staff role", () =>
      expect(canReadEnrollment(as("adviser-1", "parent"), enrollment)).toBe(false));
    it("no role", () => expect(canReadEnrollment(as("x"), enrollment)).toBe(false));
  });
});

describe("canListOwnAdvisorySections", () => {
  it("allows staff", () => expect(canListOwnAdvisorySections(as("u", "staff"))).toBe(true));
  it.each<Role>(["student", "parent", "principal", "admin"])("denies %s", (role) => {
    expect(canListOwnAdvisorySections(as("u", role))).toBe(false);
  });
});
