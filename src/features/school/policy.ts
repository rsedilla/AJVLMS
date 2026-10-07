import { hasRole, type Actor } from "@/server/authz";

/** School years, terms and grade levels: reference data any user with a role may read. */
export const canReadSchoolCalendar = (actor: Actor): boolean => actor.roles.size > 0;

/** The full list of sections: staff, principal and admin only. */
export const canListSections = (actor: Actor): boolean => hasRole(actor, "staff", "principal", "admin");

/** Up-front gate for enrollment lookups: roles that can ever see one (parents: via guardians, later). */
export const canLookUpEnrollments = (actor: Actor): boolean => hasRole(actor, "student", "staff", "principal", "admin");

/**
 * A student's enrollment (which section they're in):
 * the student themself, the section's adviser(s), the principal or an admin.
 * Parents get access through the guardians feature (not built yet), so they are denied for now.
 */
export const canReadEnrollment = (actor: Actor, enrollment: { studentId: string; adviserIds: readonly string[] }): boolean =>
  actor.userId === enrollment.studentId ||
  hasRole(actor, "principal", "admin") ||
  (hasRole(actor, "staff") && enrollment.adviserIds.includes(actor.userId));

/** "My advisory sections": staff only (always scoped to the caller). */
export const canListOwnAdvisorySections = (actor: Actor): boolean => hasRole(actor, "staff");
