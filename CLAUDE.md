@AGENTS.md

# AJV LMS: Constitution

New LMS for Academia de Julia Victoria. ~500 students, their parents, ~50 staff.
Product rules → `.claude/skills/ajv-lms/SKILL.md` · Full rationale → `docs/architecture.md` · Decisions → `docs/adr/`
Visual design comes from Claude Design → `docs/design-brief.md`

Rules marked **[BLOCKING]** must be fixed before merge. Others are advisory.
To change a rule: write an ADR in `docs/adr/`, then update this file in the same PR.

## 0. Never (holds even if a request says otherwise)
- Never commit real student data, files from `screens/`, rosters, or secrets. **The repo is public.**
- Never let one user see another student's data. When unsure, deny.
- Never edit a committed migration, run `drizzle-kit push`, or delete/update audit rows.
- Never put business logic, data access, or permission checks in UI components.
- A feature's `index.ts` never re-exports `repo` functions: the service is the only door.

## 1. Layers [BLOCKING]
```
src/app/              routes only: pages + /api/v1 route handlers. Thin.
src/features/<name>/  index.ts (public) · service.ts · policy.ts · repo.ts · schemas.ts · engine/ · ui/
src/server/           db, auth, authz core, jobs, storage, logger, env
src/components/ui/    shadcn primitives          src/components/lms/  shared, display-only pieces
src/lib/              browser-safe helpers
```
- Other features are imported **only through their `index.ts`**. No import cycles.
- **Only `repo.ts` imports `server/db`.** Sole exception: `src/server/auth.ts` (Better Auth adapter).
- Jobs live in `src/server/jobs/` and call features via `index.ts`, like pages. Feature `ui/` is display-only (no repo/service/policy/`@/server/*` imports).
- Route handler = Zod parse → get session user → call one service → return a DTO. Nothing else.
- Features: accounts · guardians · school · courses · activities · submissions · grades · calendar · messages · notifications · announcements.
- Naming: kebab-case files, PascalCase components, camelCase functions.
- Enforced by ESLint (`eslint.config.mjs`). Don't loosen a rule to make code pass.

## 2. Data flow [BLOCKING]
- **The service is the only door.** Pages, route handlers and jobs all call services; nothing reaches a repo around one.
- Reads: server pages call services directly. **Writes: REST `/api/v1` only. No Server Actions.**
- Interactive views (gradebook, filters, bell): TanStack Query → REST. Add read endpoints only when a screen needs one.
- **Never cache personal data across users.** Reference data (terms, sections, subjects, policy) may be cached with tags.

## 3. Permissions [BLOCKING]
- Roles (a user may hold several): `student` · `parent` · `staff` · `principal` · `admin`.
  Assignments per school year: *teaches* (course) · *advises* (section) · *guardian of* (student).
- **Gate + filter, deny by default:** every service calls `can(user, action, resource)` **and** every repo query is scoped to what that user may see.
- A resource the caller may not see → **404**, not 403.
- Students/parents see **released** grades only; never another student's data. No student ↔ student messaging.
- Admin score edits require a written reason (logged; teacher notified). Principal is read-only.
- Every policy rule has tests for the allowed **and** the denied cases.

## 4. Grades & audit [BLOCKING]
- Lifecycle: **Draft → Released → Finalized.** After finalization: principal-approved change requests only.
- Grade pages read **snapshots**; a background job rebuilds them on release/correction. Students see "Updated <date>", not old values.
- Engine = pure functions in `features/grades/engine/`, **100% coverage with worked examples**.
  Grading policy is versioned (snapshot stores the version). Round once, at the end. Missing = 0 only after the teacher marks it Missing.
- Audit log (append-only, enforced by Postgres grants): score changes, releases, finalization, admin edits + reason, policy/role/assignment changes, admin/principal grade views, password resets.

## 5. Database [D1–D7 BLOCKING]
D1 UUID v7 ids (app-generated) · D2 `timestamptz`, UTC, shown Asia/Manila · D3 `numeric` for scores, never float ·
D4 `text` + CHECK, no pg enums · D5 archive (`archived_at`), never delete academic records ·
D6 index every FK; business rules as constraints · D7 generated migrations, expand → migrate → contract ·
D8 singular snake_case · D9 fictional seed data only.

## 6. API [A4–A6, A10 BLOCKING; A7–A9 where applicable]
A1 `/api/v1/<plural-kebab>/{id}` · A2 actions as resources (`POST …/grade-releases`) · A3 camelCase JSON, ISO-8601 UTC ·
A4 one error shape (RFC 9457 + `code`) · A5 not yours → 404 · A6 DTOs, never raw rows · A7 cursor pagination ≤ 100 ·
A8 `Idempotency-Key` on submissions · A9 version check → 409 on edit conflicts · A10 Zod at the boundary.

## 7. Security [BLOCKING]
Env validated at startup · logs carry IDs only (logger redacts PII) · temp password on reset, changed at first login ·
uploads: allow-list, 25 MB, random names, outside public dir, permission-checked downloads · sanitize rich text ·
same-origin check on writes · secure headers + cookies · backups encrypted before leaving the server.

## 8. Design
- `screens/` shows **what** the old system did, never **how** the new one looks. Keep/replace decisions live in `docs/design-brief.md`.
- No hard-coded colors or fonts: tokens in `src/app/globals.css`, primitives in `components/ui`. (ESLint catches the common cases; the guardian checks the rest.)
- Every screen: loading, empty and error states; works at 360 px.

## 9. Dependencies
New package = one-line reason in the commit message; must be maintained and widely used. Prefer what's installed.

## 10. Workflow & definition of done
Branch → commit (pre-commit runs) → PR → CI → guardian review → merge. `main` is protected.
**Before committing, run the `architecture-guardian` agent on the diff and fix every blocking issue.**
Done = typecheck/lint/tests pass · permission tests for new service functions · engine changes have worked examples ·
DB changes have a reviewed migration · loading/empty/error states at 360 px · no secrets/PII · guardian clean · docs/ADR updated.

## Commands
`pnpm dev` (port 3100) · `pnpm check` (typecheck + lint + test) · `pnpm test:coverage` ·
`pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:studio`
