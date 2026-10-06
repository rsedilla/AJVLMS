# 0004. Feature-first folders with internal layers

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
Without structure, permission checks and queries spread across pages and components, and one forgotten check leaks a student's grades.

## Decision
`src/features/<name>/` holds everything for a feature: `index.ts` (public surface), `service.ts`, `policy.ts`, `repo.ts`, `schemas.ts`, `engine/`, `ui/`. `src/app/` holds routes only. Only `repo.ts` touches the database. Features import each other only through `index.ts`, without cycles. Enforced by ESLint (`eslint-plugin-boundaries`, `import/no-cycle`).

## Consequences
- Working on grades means working in one folder; ESLint checks the boundaries mechanically.
- A few more files per feature (`repo.ts`, `index.ts`).

## Alternatives considered
- **Layer-first** (`services/`, `repos/`): spreads one feature across many folders; grows unwieldy.
- **Services query the DB directly:** fewer files, but DB access can no longer be checked mechanically.
