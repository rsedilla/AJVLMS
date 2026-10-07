# 0007. Append-only audit log enforced in Postgres

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
Grade disputes need an indisputable history. Philippine Data Privacy Act duties favor traceable access to minors' data.

## Decision
One audit table. The application's database user has **INSERT only** on it (no UPDATE/DELETE grant). Recorded: score changes, releases, finalization, admin edits + reason, policy/role/assignment changes, admin/principal views of grades, password resets. Written in the same transaction as the change. Kept until the registrar confirms a retention period.

## Implementation
- **Table** `audit_log` (`src/server/db/schema/audit.ts`, migration 0005): who (`actor_id`, null = system), what (`action`, e.g. `section_adviser.archive`; list in `src/lib/audit-actions.ts`, format enforced by a CHECK), which record (`entity_type` + `entity_id`), whose data (`subject_user_id`), changed fields only (`before`/`after` jsonb), `reason`.
- **Two layers of enforcement:**
  1. **Triggers** (migration 0006) reject `UPDATE`, `DELETE` and `TRUNCATE` for every caller, including the table owner. *Done.*
  2. **Grants:** the runtime app connects as a separate database user that has `SELECT, INSERT` on `audit_log` and no DDL rights, so it can't drop the triggers either. A leaked app password then can't rewrite history. *Pending: the owner/app database-user split is the next PR. Until then, the app user owns the table and could, with deliberate DDL, drop the triggers; no app code path does so.*
- **Writing:** `writeAudit(tx, entry)` in `src/server/db/audit.ts` only accepts a **transaction** handle, so the audit row and the change commit or roll back together. The ESLint layer rules allow only feature `repo.ts` files to import it.
- **Reading:** `features/audit` (`getEntityHistory`, `getSubjectHistory`), principal and admin only, cursor-paginated (≤ 100) by UUID v7 id, served by `(…, id)` indexes.
- **What may be written:** only explicitly picked domain values (ids, scores, statuses, dates). `writeAudit` refuses keys that look like credentials (`password`, `hash`, `token`, `secret`, `session`, `api key`…), because rows are permanent. Contact details are referenced by id, never copied.
- **To settle before the grades feature writes `score.change`:** viewing audit history then shows students' old and new scores, which is itself an admin/principal *grade view* (§4). Either the audit read services write a `grade.view` entry, or this ADR records why not.

## Consequences
- Even a bug or a leaked app password can't rewrite history (fully true once the owner/app split lands).
- The table grows forever; it needs indexes and, later, archiving to cold storage.

## Alternatives considered
- **Application-level discipline only:** one bug could erase history.
