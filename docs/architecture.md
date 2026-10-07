# AJV LMS: Architecture handbook

The full rules and reasoning behind `CLAUDE.md` (the constitution). `CLAUDE.md` is the short version loaded into every session; this file explains each rule.
Decisions were agreed on 2026-10-07. Changing one requires an ADR in `docs/adr/` and an update to both files.

## Governance
- Four layers: `CLAUDE.md` (always loaded) · `.claude/skills/ajv-lms` (product knowledge) · `architecture-guardian` agent · automated checks (ESLint + pre-commit).
- Guardian: **blocking** for rules on layers, thin routes, REST writes, permissions, grades/audit, database; **blocking** also for API rules A4–A6/A10 and security (S1–S8); **advisory** for the rest. Runs before each commit.
- Repo is public for now: no real student data, no secrets, ever (`screens/` and `.env` are git-ignored).

## Layers
<a id="layers"></a>
1. **Feature-first** structure: `src/features/<feature>/` with `index.ts` (public surface), `service.ts`, `policy.ts`, `repo.ts`, `schemas.ts`, optional `engine/` (pure logic) and `ui/`.
   `src/app/` = routes only · `src/server/` = shared infrastructure · `src/components/ui` (shadcn) · `src/components/lms` (shared display pieces) · `src/lib/` (browser-safe helpers).
2. **`repo.ts` is the only place a feature touches the database.**
3. **Features:** accounts · **guardians** (parent ↔ student links, separate because access rules are sensitive) · school · courses · activities · submissions · grades · calendar · messages · notifications · announcements.
4. **Naming:** kebab-case files, PascalCase components, camelCase functions.
- Background jobs live in `src/server/jobs/` and call features through `index.ts` like pages do; they never touch the DB directly.
- The only non-repo file that may import `server/db` is `src/server/auth.ts` (the Better Auth adapter). `server/db` may read `src/server/env.ts`.
- Feature `ui/` components are display-only: no imports of `repo`, `service`, `policy` or `@/server/*`; pages pass data in as props.
- Import rules: app → features only via `index.ts`; features → other features only via `index.ts`; no cycles; `server/db` only from `repo.ts`; client code never imports server code.

## Design
- Visual design comes from **Claude Design**. `docs/design-brief.md` is the hand-off.
- `screens/` is a **reference**: elements are kept / improved / replaced **on purpose** (see the brief), never copied by accident.
- Code holds **no visual decisions** outside design tokens (`globals.css`) and `components/`. Components in `components/` are display-only (no data access, no permission logic).
- School brand colors stay in tokens as a starting point; Claude Design may adjust them.

## Data flow
1. **Reads:** server pages/components call feature **services** directly (no HTTP hop to our own API).
   **Writes:** always browser → REST `/api/v1/*` → service. **No Server Actions.**
   **Interactive screens** (gradebook, filters, bell): TanStack Query → REST.
2. **"The service is the only door"** (blocking): pages, route handlers and jobs all go through services; nothing reaches `repo`/DB around a service.
3. **Caching:** personal data (grades, submissions, messages, notifications) is **never** cached across users. School-wide reference data (terms, sections, subjects, grading policy) and course content may be cached with tags, invalidated on edit.
4. **REST read endpoints are built only when a screen or app needs them** (writes always get endpoints).

## Permissions
1. **Base roles + assignments.** Base roles (a user may hold several): `student`, `parent`, `staff`, `principal`, `admin`.
   Assignments, per school year with start/end: *teaches* (course), *advises* (section), *guardian of* (student).
   → Implemented: roles live in `user_role` (`src/server/db/schema/accounts.ts`, list in `src/lib/roles.ts`); the old `role` enum was removed by migrations 0001–0003. The signed-in user is loaded as an `Actor` by `features/accounts` (`getCurrentActor` / `requireActor`).
2. **Two layers, deny by default** (blocking): the gate (`policy.ts` → `can(user, action, resource)`) **and** the filter (every `repo` query scoped to what the user may see). Every policy rule has a test.
3. **Matrix** (as discussed), including:
   - Advisers see **released** grades for all subjects of their section only.
   - **No student ↔ student messaging.** Students message teachers; parents message their children's teachers.
   - Students/parents **never** see another student's data.
   - Admin reads of student grades are **logged**.
4. **Admins may edit a score only with a written reason**: logged, and the course teacher is notified.
5. **`principal` role:** read-only access to all grades and reports; no account management, no edits.
6. **"View as student"** (admin support): **P2**, read-only, every use logged.

## Grades & audit
1. **Lifecycle: Draft → Released → Finalized.** Draft = teacher only. Released = visible to student/parent/adviser. Finalized = term locked by registrar; changes only via a **grade change request approved by the principal**.
2. **Corrections after release** are allowed until finalization; the student/parent gets a "grade updated" notification; every version is kept.
   On release or correction a background job recomputes the term **snapshot**; pages read snapshots only.
3. Students/parents see **"Updated <date>"** only. Old values are visible to the teacher, principal and admin.
4. **Missing work counts as 0 only once the teacher marks it Missing** (until then it shows as Missing but isn't computed). The school may change this default (grading policy setting).
5. **Grade engine:** pure functions; **grading policy is versioned** and each snapshot stores the policy version; **round once, at the end**; the quiz attempt rule (highest/latest/average) is set per quiz with a school default.
6. **Audit log is append-only, enforced in PostgreSQL** (the app's DB user has INSERT only on the audit table, no UPDATE/DELETE). It records score changes, releases, finalization, admin edits + reason, policy changes, role/assignment changes, admin/principal views of student grades, and password resets. Implemented: triggers reject UPDATE/DELETE/TRUNCATE (migration 0006); the INSERT-only grant arrives with the owner/app database-user split. Writer: `writeAudit(tx, ...)` in `src/server/db/audit.ts`, transaction-only, callable from `repo.ts` only (see ADR 0007).
7. **Audit retention:** never delete until the registrar confirms the school's record-retention period.
8. **Grade engine: 100% test coverage with real worked examples** (blocking).

## Database & API conventions
**Database**
- D1 UUID v7 ids, generated in the app (Better Auth tables keep their own text ids).
- D2 Instants: `timestamptz`, stored UTC, displayed Asia/Manila. Calendar days (school year/term boundaries, date-only due dates): `date`, a Manila calendar day (ADR 0009).
- D3 Scores/grades use `numeric`, never float.
- D4 Fixed value lists = `text` + CHECK constraint (no Postgres enums). → convert the current `role` enum.
- D5 Academic records are never hard-deleted; use `archived_at`.
- D6 Every FK indexed; business rules as DB constraints (e.g. unique submission per student × activity).
- D7 Migrations: generated, reviewed, never edited after commit, never `drizzle-kit push`; destructive changes via expand → migrate → contract.
- D8 Singular snake_case table/column names.
- D9 Seed/test data always fictional.

**REST API**
- A1 `/api/v1/<plural-kebab-nouns>/{id}/...`
- A2 Non-CRUD actions are created resources (e.g. `POST /courses/{id}/grade-releases`).
- A3 camelCase JSON, ISO-8601 UTC dates.
- A4 One error shape everywhere (RFC 9457 problem details + `code` + field `errors`).
- A5 Resources the caller may not see → **404**, not 403.
- A6 Never return raw DB rows; explicit response DTOs.
- A7 Cursor pagination, max 100 per page.
- A8 Submissions accept an `Idempotency-Key`.
- A9 Edits use optimistic concurrency (version check → 409 on conflict).
- A10 Zod validation at the boundary; the same schemas power forms.

**Enforcement:** D1–D7, A4–A6, A10 **block**; A7–A9 **block where applicable** (lists, submissions, edits); D8, A1–A3 **warn**.
**API docs:** auto-generated from Zod schemas (OpenAPI), **development only**.

## Security, dependencies, workflow
**Security**
- S1 Env vars validated at startup (Zod); app refuses to start if invalid.
- S2 Logs carry IDs only; logger redacts names, grades, addresses, passwords, tokens.
- S3 Admin password reset issues a temporary password that must be changed at first login.
- S4 Uploads: allow-listed types (PDF, Word, PowerPoint, images), **25 MB max**, random stored names, outside public folder, permission-checked downloads.
- S5 Rich text sanitized before rendering.
- S6 Same-origin check on all REST writes (plus Better Auth protections).
- S7 Security headers + secure, httpOnly, sameSite cookies.
- S8 Backups encrypted before leaving the server.
- Data Privacy Act (RA 10173) checklist for the school: **P1 deliverable**.

**Dependencies:** a new package needs a one-line reason in the commit, must be maintained and widely used; prefer what's installed; lockfile committed; install scripts only if allow-listed; Dependabot PRs reviewed weekly.
Runtime-coupled packages follow the runtime, not the latest release: `@types/node` stays on the Node major we run (`.nvmrc`). Peer-constrained tools are held to what their dependents support (e.g. TypeScript below typescript-eslint's peer range). Both are pinned via `ignore` rules in `.github/dependabot.yml`, each with a comment saying when to remove it.

**Workflow:** feature branch → commit (pre-commit checks) → push → PR → CI → guardian review → merge. **`main` is protected** (CI must pass).
Enforcement is honest: pre-commit + CI are truly blocking; the AI guardian is instruction-based and reports, the human decides.

**Definition of done:** (1) typecheck, lint, tests pass · (2) permission tests for new service functions · (3) worked-example tests for grade engine changes · (4) reviewed migration for DB changes · (5) loading/empty/error states, works at 360 px · (6) no secrets or real personal data · (7) guardian: no blocking issues · (8) docs/ADR updated if a decision changed.

## Enforcement map
| Rule | Enforced by |
|---|---|
| Layers, import boundaries, cycles | ESLint `boundaries/dependencies`, `import/no-cycle` (`eslint.config.mjs`) |
| No Server Actions, no console, no hard-coded colors | ESLint `no-restricted-syntax`, `no-console` |
| Secrets / forbidden files | `scripts/check-staged.mjs` (pre-commit), CI forbidden-files step, gitleaks, GitHub push protection |
| Migrations never edited | CI migration guard |
| Grade engine 100% coverage | Vitest coverage thresholds (`vitest.config.ts`) |
| Types, build | `pnpm typecheck`, `pnpm build` in CI |
| Everything a program can't judge (right layer? correct policy? PII in a DTO?) | `architecture-guardian` agent (advisory: it reports, the human decides) |
