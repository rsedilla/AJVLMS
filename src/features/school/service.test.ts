import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@/lib/roles";
import { NotFoundError, type Actor } from "@/server/authz";
import type { EnrollmentRecord } from "./schemas";

const record: EnrollmentRecord = {
  id: "e-1",
  studentId: "student-1",
  schoolYearId: "y-1",
  section: { id: "s-1", name: "Rizal", gradeLevelName: "Grade 8" },
  adviserIds: ["adviser-1"],
};

vi.mock("./repo", () => ({
  findCurrentSchoolYear: vi.fn(async () => null),
  findTermsBySchoolYear: vi.fn(async () => []),
  findGradeLevels: vi.fn(async () => []),
  findSectionsBySchoolYear: vi.fn(async () => []),
  findSectionsAdvisedBy: vi.fn(async () => []),
  // Simulates the SQL filter: only the student, an active adviser, or principal/admin get the row.
  findActiveEnrollmentVisibleTo: vi.fn(async (actor: Actor, studentId: string) =>
    studentId === "student-1" &&
    (actor.userId === "student-1" || record.adviserIds.includes(actor.userId) || actor.roles.has("admin"))
      ? structuredClone(record)
      : null,
  ),
}));

const service = await import("./service");
const repo = await import("./repo");
const as = (userId: string, ...roles: Role[]): Actor => ({ userId, roles: new Set(roles) });

beforeEach(() => vi.clearAllMocks());

describe("gates run before the repo", () => {
  it("listSections denies a student without touching the repo", async () => {
    await expect(service.listSections(as("s", "student"), "y-1")).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.findSectionsBySchoolYear).not.toHaveBeenCalled();
  });

  it("getCurrentSchoolYear denies a user with no role without touching the repo", async () => {
    await expect(service.getCurrentSchoolYear(as("x"))).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.findCurrentSchoolYear).not.toHaveBeenCalled();
  });

  it("getStudentEnrollment denies a parent before any query", async () => {
    await expect(service.getStudentEnrollment(as("parent-1", "parent"), "student-1", "y-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.findActiveEnrollmentVisibleTo).not.toHaveBeenCalled();
  });
});

describe("listMyAdvisorySections (filter)", () => {
  it("always scopes the query to the caller's own id", async () => {
    await service.listMyAdvisorySections(as("staff-1", "staff"), "y-1");
    expect(repo.findSectionsAdvisedBy).toHaveBeenCalledWith("staff-1", "y-1");
  });

  it("denies non-staff", async () => {
    await expect(service.listMyAdvisorySections(as("p", "parent"), "y-1")).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.findSectionsAdvisedBy).not.toHaveBeenCalled();
  });
});

describe("getStudentEnrollment", () => {
  it("returns the enrollment to the student themself, without adviser ids (A6)", async () => {
    const dto = await service.getStudentEnrollment(as("student-1", "student"), "student-1", "y-1");
    expect(dto).toEqual({ id: "e-1", studentId: "student-1", schoolYearId: "y-1", section: record.section });
    expect(dto).not.toHaveProperty("adviserIds");
  });

  it("returns it to the section's adviser", async () => {
    const dto = await service.getStudentEnrollment(as("adviser-1", "staff"), "student-1", "y-1");
    expect(dto.section.name).toBe("Rizal");
  });

  it("passes the actor into the repo, so the query itself is scoped (filter)", async () => {
    const actor = as("student-2", "student");
    await expect(service.getStudentEnrollment(actor, "student-1", "y-1")).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.findActiveEnrollmentVisibleTo).toHaveBeenCalledWith(actor, "student-1", "y-1");
  });

  it("the filter alone produces a 404 for an outsider staff member", async () => {
    await expect(service.getStudentEnrollment(as("staff-9", "staff"), "student-1", "y-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("the after-fetch gate still denies if a row ever leaked through the filter", async () => {
    vi.mocked(repo.findActiveEnrollmentVisibleTo).mockResolvedValueOnce(structuredClone(record));
    await expect(service.getStudentEnrollment(as("staff-9", "staff"), "student-1", "y-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("a missing enrollment looks the same as a denied one (A5)", async () => {
    await expect(service.getStudentEnrollment(as("student-2", "student"), "student-2", "y-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
