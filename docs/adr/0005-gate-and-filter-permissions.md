# 0005. Permissions: roles + assignments, gate + filter

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
A single role per user can't express real cases: a teacher who is also a parent, advisers who change every year, teachers who only teach some courses. The worst possible bug is one user seeing another student's data.

## Decision
- Base roles (several per user): `student`, `parent`, `staff`, `principal`, `admin`. Responsibilities are **assignments** per school year: teaches(course), advises(section), guardianOf(student).
- Two layers, deny by default: **gate** (`can(user, action, resource)` in every service) and **filter** (every repo query scoped to what the user may see).
- Not yours → 404. Admin score edits need a reason; principal is read-only; no student-to-student messaging.

## Consequences
- A forgotten gate check is still caught by the filter (defense in depth).
- Every policy rule needs allowed and denied tests.
- The initial `role` enum (with `adviser`) must be migrated to roles + assignments.

## Alternatives considered
- **Single role column:** simple, but wrong for real staff.
- **Postgres row-level security:** strong, but harder to test and debug for a solo developer; may be revisited.
