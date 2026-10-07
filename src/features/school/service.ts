import "server-only";
import { assertCan, NotFoundError, type Actor } from "@/server/authz";
import {
  canListOwnAdvisorySections,
  canListSections,
  canLookUpEnrollments,
  canReadEnrollment,
  canReadSchoolCalendar,
} from "./policy";
import * as repo from "./repo";
import type { EnrollmentDto, GradeLevelDto, SchoolYearDto, SectionDto, TermDto } from "./schemas";

export async function getCurrentSchoolYear(actor: Actor): Promise<SchoolYearDto | null> {
  assertCan(canReadSchoolCalendar(actor));
  return repo.findCurrentSchoolYear();
}

export async function listTerms(actor: Actor, schoolYearId: string): Promise<TermDto[]> {
  assertCan(canReadSchoolCalendar(actor));
  return repo.findTermsBySchoolYear(schoolYearId);
}

export async function listGradeLevels(actor: Actor): Promise<GradeLevelDto[]> {
  assertCan(canReadSchoolCalendar(actor));
  return repo.findGradeLevels();
}

export async function listSections(actor: Actor, schoolYearId: string): Promise<SectionDto[]> {
  assertCan(canListSections(actor));
  return repo.findSectionsBySchoolYear(schoolYearId);
}

/** Sections the caller advises (gate: staff; filter: scoped to the caller's own id). */
export async function listMyAdvisorySections(actor: Actor, schoolYearId: string): Promise<SectionDto[]> {
  assertCan(canListOwnAdvisorySections(actor));
  return repo.findSectionsAdvisedBy(actor.userId, schoolYearId);
}

/**
 * A student's section for a school year. Three layers (ADR 0005):
 * gate before the query, filter inside the query, gate on the fetched row.
 * "No enrollment" and "not allowed" both throw NotFoundError (A5).
 */
export async function getStudentEnrollment(actor: Actor, studentId: string, schoolYearId: string): Promise<EnrollmentDto> {
  assertCan(canLookUpEnrollments(actor));
  const found = await repo.findActiveEnrollmentVisibleTo(actor, studentId, schoolYearId);
  if (!found) throw new NotFoundError();
  assertCan(canReadEnrollment(actor, found));
  // Explicit DTO: the policy input (adviserIds) stays internal (A6).
  return { id: found.id, studentId: found.studentId, schoolYearId: found.schoolYearId, section: found.section };
}
