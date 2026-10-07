import "server-only";
import { and, asc, eq, exists, isNull, or, sql, type SQL } from "drizzle-orm";
import { hasRole, type Actor } from "@/server/authz";
import { db } from "@/server/db";
import { enrollment, gradeLevel, schoolYear, section, sectionAdviser, term } from "@/server/db/schema";
import type { EnrollmentRecord, GradeLevelDto, SchoolYearDto, SectionDto, TermDto } from "./schemas";

const schoolYearColumns = {
  id: schoolYear.id,
  name: schoolYear.name,
  startsOn: schoolYear.startsOn,
  endsOn: schoolYear.endsOn,
  isCurrent: schoolYear.isCurrent,
};

export async function findCurrentSchoolYear(): Promise<SchoolYearDto | null> {
  const [row] = await db
    .select(schoolYearColumns)
    .from(schoolYear)
    .where(and(eq(schoolYear.isCurrent, true), isNull(schoolYear.archivedAt)))
    .limit(1);
  return row ?? null;
}

export async function findTermsBySchoolYear(schoolYearId: string): Promise<TermDto[]> {
  return db
    .select({
      id: term.id,
      schoolYearId: term.schoolYearId,
      sequence: term.sequence,
      name: term.name,
      startsOn: term.startsOn,
      endsOn: term.endsOn,
    })
    .from(term)
    .where(and(eq(term.schoolYearId, schoolYearId), isNull(term.archivedAt)))
    .orderBy(asc(term.sequence));
}

export async function findGradeLevels(): Promise<GradeLevelDto[]> {
  return db
    .select({ id: gradeLevel.id, name: gradeLevel.name, sortOrder: gradeLevel.sortOrder })
    .from(gradeLevel)
    .where(isNull(gradeLevel.archivedAt))
    .orderBy(asc(gradeLevel.sortOrder));
}

const sectionColumns = {
  id: section.id,
  schoolYearId: section.schoolYearId,
  name: section.name,
  gradeLevelId: section.gradeLevelId,
  gradeLevelName: gradeLevel.name,
};

export async function findSectionsBySchoolYear(schoolYearId: string): Promise<SectionDto[]> {
  return db
    .select(sectionColumns)
    .from(section)
    .innerJoin(gradeLevel, eq(gradeLevel.id, section.gradeLevelId))
    .where(and(eq(section.schoolYearId, schoolYearId), isNull(section.archivedAt)))
    .orderBy(asc(gradeLevel.sortOrder), asc(section.name));
}

/** Filter: only sections the given user advises. */
export async function findSectionsAdvisedBy(userId: string, schoolYearId: string): Promise<SectionDto[]> {
  return db
    .select(sectionColumns)
    .from(sectionAdviser)
    .innerJoin(section, eq(section.id, sectionAdviser.sectionId))
    .innerJoin(gradeLevel, eq(gradeLevel.id, section.gradeLevelId))
    .where(
      and(
        eq(sectionAdviser.userId, userId),
        isNull(sectionAdviser.archivedAt),
        eq(section.schoolYearId, schoolYearId),
        isNull(section.archivedAt),
      ),
    )
    .orderBy(asc(gradeLevel.sortOrder), asc(section.name));
}

/**
 * Filter (ADR 0005): the WHERE clause itself only matches enrollments the actor may see:
 * their own, any (principal/admin), or one in a section they actively advise (staff).
 * Anyone else gets no row, even if the service's gate were removed.
 */
function enrollmentVisibleTo(actor: Actor): SQL {
  if (hasRole(actor, "principal", "admin")) return sql`true`;
  const ownRow = eq(enrollment.studentId, actor.userId);
  if (!hasRole(actor, "staff")) return ownRow;
  const advises = exists(
    db
      .select({ one: sql`1` })
      .from(sectionAdviser)
      .where(
        and(
          eq(sectionAdviser.sectionId, enrollment.sectionId),
          eq(sectionAdviser.userId, actor.userId),
          isNull(sectionAdviser.archivedAt),
        ),
      ),
  );
  return or(ownRow, advises)!;
}

/** One student's active enrollment for one school year, if the actor may see it. */
export async function findActiveEnrollmentVisibleTo(
  actor: Actor,
  studentId: string,
  schoolYearId: string,
): Promise<EnrollmentRecord | null> {
  const [row] = await db
    .select({
      id: enrollment.id,
      studentId: enrollment.studentId,
      schoolYearId: enrollment.schoolYearId,
      sectionId: section.id,
      sectionName: section.name,
      gradeLevelName: gradeLevel.name,
    })
    .from(enrollment)
    .innerJoin(section, eq(section.id, enrollment.sectionId))
    .innerJoin(gradeLevel, eq(gradeLevel.id, section.gradeLevelId))
    .where(
      and(
        eq(enrollment.studentId, studentId),
        eq(enrollment.schoolYearId, schoolYearId),
        isNull(enrollment.archivedAt),
        enrollmentVisibleTo(actor),
      ),
    )
    .limit(1);
  if (!row) return null;

  const advisers = await db
    .select({ userId: sectionAdviser.userId })
    .from(sectionAdviser)
    .where(and(eq(sectionAdviser.sectionId, row.sectionId), isNull(sectionAdviser.archivedAt)));

  return {
    id: row.id,
    studentId: row.studentId,
    schoolYearId: row.schoolYearId,
    section: { id: row.sectionId, name: row.sectionName, gradeLevelName: row.gradeLevelName },
    adviserIds: advisers.map((a) => a.userId),
  };
}

