// Every auditable action (CLAUDE.md §4, ADR 0007). Adding a feature that changes grades, roles or
// assignments means adding its actions here first; the DB CHECK on audit_log.action keeps the format honest.
export const AUDIT_ACTIONS = [
  // accounts
  "role.grant",
  "role.revoke",
  "password.reset",
  // school assignments
  "enrollment.create",
  "enrollment.archive",
  "section_adviser.assign",
  "section_adviser.archive",
  // grades (reserved for the grades feature)
  "score.change",
  "grade.release",
  "grade.finalize",
  "grade.change_request.approve",
  "grading_policy.change",
  // sensitive reads (§4: admin/principal views of student grades)
  "grade.view",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** `<entity>.<verb>`: lowercase words and underscores. Mirrors the DB CHECK constraint. */
export const AUDIT_ACTION_FORMAT = /^[a-z_]+(\.[a-z_]+)+$/;
