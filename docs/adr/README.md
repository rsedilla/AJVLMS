# Architecture Decision Records

Short records of **why** a decision was made. To change a rule in `CLAUDE.md`, add a new ADR (copy `template.md`), set the old one's status to "Superseded by NNNN", and update `CLAUDE.md` + `docs/architecture.md` in the same PR.

| # | Decision | Status |
|---|---|---|
| [0001](0001-nextjs-rest-no-server-actions.md) | Next.js with a REST API; no Server Actions | Accepted |
| [0002](0002-postgresql-drizzle.md) | PostgreSQL + Drizzle ORM | Accepted |
| [0003](0003-plain-vps-no-docker.md) | Hostinger VPS without Docker | Accepted |
| [0004](0004-feature-first-layers.md) | Feature-first folders with internal layers | Accepted |
| [0005](0005-gate-and-filter-permissions.md) | Permissions: roles + assignments, gate + filter | Accepted |
| [0006](0006-grade-lifecycle-and-snapshots.md) | Grade lifecycle and snapshots | Accepted |
| [0007](0007-append-only-audit-log.md) | Append-only audit log enforced in Postgres | Accepted |
| [0008](0008-public-repo-during-development.md) | Public repository during development | Accepted |
| [0009](0009-calendar-dates-vs-instants.md) | Calendar dates use `date`; instants use `timestamptz` | Accepted |
