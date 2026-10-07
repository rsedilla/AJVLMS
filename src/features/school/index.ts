// Public surface of the school feature. Never re-export repo functions (CLAUDE.md §0).
export {
  getCurrentSchoolYear,
  getStudentEnrollment,
  listGradeLevels,
  listMyAdvisorySections,
  listSections,
  listTerms,
} from "./service";
export type { EnrollmentDto, GradeLevelDto, SchoolYearDto, SectionDto, TermDto } from "./schemas";
