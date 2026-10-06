# 0002. PostgreSQL + Drizzle ORM

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
Grades need exact decimals, strong constraints, transactions and fine-grained grants (append-only audit). Grade computation needs readable, SQL-like queries.

## Decision
PostgreSQL 16 (local and on the server) with Drizzle ORM and generated, committed migrations.

## Consequences
- Queries read like SQL, which suits grade calculations; schema lives in TypeScript.
- Migrations are reviewed files; `drizzle-kit push` is never used against real data.
- Developers need some SQL comfort.

## Alternatives considered
- **Prisma:** friendlier schema file, heavier runtime; complex grade queries end up as raw SQL anyway.
- **MySQL:** offered by shared hosting, but weaker for the constraints and grants we rely on.
