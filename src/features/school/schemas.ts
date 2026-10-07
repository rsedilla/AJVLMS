// Response shapes (DTOs) for the school feature (A6: never raw rows).

export type SchoolYearDto = {
  id: string;
  name: string;
  startsOn: string; // ISO date, e.g. "2026-06-08"
  endsOn: string;
  isCurrent: boolean;
};

export type TermDto = { id: string; schoolYearId: string; sequence: number; name: string; startsOn: string; endsOn: string };

export type GradeLevelDto = { id: string; name: string; sortOrder: number };

export type SectionDto = { id: string; schoolYearId: string; name: string; gradeLevelId: string; gradeLevelName: string };

export type EnrollmentDto = {
  id: string;
  studentId: string;
  schoolYearId: string;
  section: { id: string; name: string; gradeLevelName: string };
};

/** Internal only: the DTO plus what the policy needs. Never returned to callers (A6). */
export type EnrollmentRecord = EnrollmentDto & { adviserIds: string[] };
