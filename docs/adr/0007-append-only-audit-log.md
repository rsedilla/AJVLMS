# 0007. Append-only audit log enforced in Postgres

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
Grade disputes need an indisputable history. Philippine Data Privacy Act duties favor traceable access to minors' data.

## Decision
One audit table. The application's database user has **INSERT only** on it (no UPDATE/DELETE grant). Recorded: score changes, releases, finalization, admin edits + reason, policy/role/assignment changes, admin/principal views of grades, password resets. Written in the same transaction as the change. Kept until the registrar confirms a retention period.

## Consequences
- Even a bug or a leaked app password can't rewrite history.
- The table grows forever; it needs indexes and, later, archiving to cold storage.

## Alternatives considered
- **Application-level discipline only:** one bug could erase history.
