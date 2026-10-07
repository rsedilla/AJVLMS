# AJV Learning Portal

New LMS for Academia de Julia Victoria (replacing GascloudLMS).
**Rules: [`CLAUDE.md`](CLAUDE.md) (the constitution)** · [Architecture](docs/architecture.md) · [Decisions](docs/adr/README.md) · [Design brief](docs/design-brief.md) · Product: [`.claude/skills/ajv-lms/SKILL.md`](.claude/skills/ajv-lms/SKILL.md) · Audit of the old system: [`docs/AUDIT.md`](docs/AUDIT.md) · Old screens: `screens/` (local only, not in the repo: contains real student data)

**Stack:** Next.js 16 · TypeScript · shadcn/ui · PostgreSQL 16 · Drizzle · Better Auth · pnpm

## First-time setup (Windows)

Requires Node 22+, pnpm, and PostgreSQL 16 running locally.

```bash
pnpm install
```

`.env` is already generated locally (copy `.env.example` on a new machine and fill it in). Then:

```bash
pnpm db:setup      # creates the ajvlms database + user (asks for your postgres password once)
pnpm db:migrate    # creates the tables
pnpm db:seed       # adds one test account per role (password = SEED_PASSWORD in .env)
pnpm dev           # http://localhost:3100
```

Seed usernames: `admin`, `principal`, `t-0001` (staff), `t-0002` (staff + parent), `2099-0001` (student), `p-0001` (parent).

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on port 3100 |
| `pnpm check` | Typecheck + lint + all tests. (Pre-commit runs a faster subset; CI runs this plus coverage, build, migration guard and secret scan) |
| `pnpm test:coverage` | Tests with coverage (grade engine must be 100%) |
| `pnpm db:generate` | After editing `src/server/db/schema/*`, creates a new migration in `drizzle/` |
| `pnpm db:migrate` | Applies pending migrations |
| `pnpm db:studio` | Browse the database in the browser |

## Workflow

```
git switch -c feat/<thing>   → work → commit (pre-commit hook: forbidden files, lint, related tests, typecheck)
git push -u origin HEAD      → open a PR → CI must pass → architecture-guardian review → merge
```
`main` is protected: changes only arrive through pull requests with green CI. Never commit anything from `screens/` or `.env`; the repo is public.
