# 0005. Permissions: roles + assignments, gate + filter

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
A single role per user can't express real cases: a teacher who is also a parent, advisers who change every year, teachers who only teach some courses. The worst possible bug is one user seeing another student's data.

## Decision
- Base roles (several per user): `student`, `parent`, `staff`, `principal`, `admin`. Responsibilities are **assignments** per school year: teaches(course), advises(section), guardianOf(student).
- Two layers, deny by default: **gate** (`can(user, action, resource)` in every service) and **filter** (every repo query scoped to what the user may see).
- Not yours → 404. Admin score edits need a reason; principal is read-only; no student-to-student messaging.

### The one exception: building the Actor
`getCurrentActor()` / `requireActor()` in `features/accounts` load the signed-in user's own roles **without** calling `can()`, because every `can()` check needs an Actor to exist first. This is safe only because they read nothing but the session user's own id. **This exception is not a pattern:** every other service function must call `can()`. An `Actor` must come from `getCurrentActor`/`requireActor` (or, later, a documented system actor for jobs), never be built by hand in feature code.

### When the gate needs the resource's relationships
Some checks depend on data about the resource (e.g. "is the caller an active adviser of this student's section?"). Fetching without a filter and then checking is **not enough**: the repo query must still include the actor-scoped predicate (see `findActiveEnrollmentVisibleTo` in `features/school/repo.ts`), so removing the gate never leaks data. Pattern: cheap role gate → actor-scoped query → gate on the fetched row.

## Consequences
- A forgotten gate check is still caught by the filter (defense in depth).
- Every policy rule needs allowed and denied tests.
- The initial `role` enum (with `adviser`) was migrated to the `user_role` table by migrations 0001–0003 (expand → migrate → contract). Assignment tables arrive with the school, courses and guardians features.

## Alternatives considered
- **Single role column:** simple, but wrong for real staff.
- **Postgres row-level security:** strong, but harder to test and debug for a solo developer; may be revisited.
