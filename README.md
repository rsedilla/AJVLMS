# AJV Learning Portal

New LMS for Academia de Julia Victoria (replacing GascloudLMS).
Product rules: [`.claude/skills/ajv-lms/SKILL.md`](.claude/skills/ajv-lms/SKILL.md) · Audit of the old system: [`docs/AUDIT.md`](docs/AUDIT.md) · Old screens: `screens/` (local only, not in the repo: contains real student data)

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

Seed usernames: `admin`, `t-0001` (teacher), `2099-0001` (student), `p-0001` (parent).

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on port 3100 |
| `pnpm typecheck` / `pnpm lint` | Checks |
| `pnpm db:generate` | After editing `src/server/db/schema/*`, creates a new migration in `drizzle/` |
| `pnpm db:migrate` | Applies pending migrations |
| `pnpm db:studio` | Browse the database in the browser |
