---
name: ajv-lms
description: Product, domain, and UI rules for rebuilding the Academia de Julia Victoria LMS (replacing GascloudLMS). Use whenever designing, building, or reviewing any AJV LMS screen, data model, API, or feature, especially grades, dashboards, courses, activities, or role-specific (student/teacher/parent/admin) flows.
---

# AJV LMS rebuild

You are building the new LMS for **Academia de Julia Victoria** (a Catholic K–12 school in Bacoor, Cavite, Philippines). It replaces a hosted GascloudLMS instance (a Metronic admin template).

Read these before making product decisions:
- `screens/INDEX.md` + `screens/*.jpg`: the current system, 38 screenshots (student role)
- `docs/AUDIT.md`: what's wrong with it, by role, with a grades deep-dive and open questions

**The main goal: a student or parent can answer "How am I doing?" and "What do I need to do next?" in one screen each.** If a design doesn't make one of those easier, question why it's there.

---

## 1. Roles

| Role | Core jobs |
|---|---|
| **Student** | See what's due, do lessons/quizzes/assignments, see grades + feedback, message teachers |
| **Parent/Guardian** | Read-only view of one or more children: grades, missing work, schedule, announcements |
| **Teacher** | Build/copy courses, post activities, grade in a gradebook, release grades, give feedback, announce to a class |
| **Adviser** | A teacher who also owns a section: conduct grades, sees all subjects for their section |
| **Admin/Registrar** | Accounts (bulk import), sections, terms, course assignment, grading policy, report cards |

Check permissions on the server for every endpoint. Parents and students only ever see **released** grades.

## 2. Domain model (the names to use everywhere)

```
SchoolYear 1─* Term                 (e.g. SY 2026-2027 → T1, T2, T3; confirm "term" vs "quarter" with the school)
GradeLevel 1─* Section              (Grade 8 → Rizal)
Section *─* Student                 (Student.studentNo = "2099-0001", the login username)
Subject                             (Math 8, MAPEH 8, Filipino 8 …), which has a GradingPolicy
Course = Subject × Section × Term   (one teacher owns it; its display name is GENERATED, never typed by hand)
Course 1─* Module                   (e.g. "Topic Outline/Lessons")
Module 1─* Activity                 type: lesson | quiz | assignment | live_class
Activity ─ gradeComponent?          WW | PT | QA (null for ungraded lessons)
Activity 1─* Submission             (per student; may have many attempts)
Submission 1─* Attempt              (quiz attempts; the policy says which one counts)
Submission ─ Grade                  score, maxScore, status, releasedAt, feedback
GradingPolicy                       component weights per subject + transmutation table + attempt rule
Announcement, Note, CalendarEvent, Thread/Message, Notification
Guardian *─* Student
```

Generated course name: `{Subject} · {Section} · {Term}`, for example **"Math 8 · Rizal · T2"**. This removes the inconsistent hand-typed names seen today ("T2 - Math 8 Rizal", "MAPEH 8 RIZAL T2").

## 3. Activity status: one vocabulary

Every gradable item for a student is in **exactly one** of these states. Use the same label, color, and icon everywhere (dashboard, course, grades, calendar, notifications):

| Status | Meaning | Token |
|---|---|---|
| `not_started` | Open, nothing submitted | neutral |
| `due_soon` | Not submitted, due ≤ 48h | warning |
| `submitted` | Submitted, awaiting grade | info |
| `graded` | Score released | success / by score band |
| `late` | Submitted after the due date | warning outline |
| `missing` | Past due, nothing submitted | danger |
| `excused` | Teacher exempted it | muted |
| `locked` | Not yet available | muted + lock icon |

**Never show a blank score cell.** Blank must always be one of the statuses above.

## 4. Grades rules (most important section)

1. **Grades is a top-level navigation item** for students and parents.
2. **Never show completion % in a way that looks like a grade.** Completion = a thin neutral bar + the text "8 of 12 done". Grade = a number with a score band color. Never put both in the same visual slot.
3. Term grade = weighted components → **transmuted** using `GradingPolicy` (default assumption: DepEd Order 8 s.2015 style WW/PT/QA weights per subject; **confirm with the school before hard-coding**). Show the formula on the subject page: `WW 30% · PT 50% · QA 20%`.
4. Show the **initial grade and the transmuted grade** separately only to teachers; students and parents see the transmuted grade + descriptor (Outstanding / Very Satisfactory / Satisfactory / Fairly Satisfactory / Did Not Meet Expectations).
5. Every score shows **raw + percent**: `18/20 · 90%`.
6. Quizzes with several attempts show **all attempts**, with the counted one marked, and the rule stated ("Highest attempt counts").
7. Grades become visible only when the teacher **releases** them (per activity or in bulk). Releasing triggers a notification.
8. Feedback appears **next to the score** in the grades list (first line + "more"), not only inside the activity.
9. "Missed / Pending / Locked" counts must always **link to the filtered list**.
10. Score bands (for color only; also include a text label for accessibility): ≥90 Outstanding, 85–89 Very Satisfactory, 80–84 Satisfactory, 75–79 Fairly Satisfactory, <75 Did Not Meet Expectations.

## 5. Information architecture

| New nav | Replaces | Notes |
|---|---|---|
| **Home** | Dashboard | Order: Due soon → Missing → Recently graded → Today's classes → Announcements. Learning-hours stats move to the bottom or into Reports |
| **Courses** | Courses | Defaults to the current term, with a term switcher. Each card shows the **next due item** + missing count |
| **Grades** | Reports (Assignment/Quizzes views) | Term overview → subject drill-down → activity |
| **Calendar** | Calendar | Short labels ("Quiz 2.1 due"), color by status, personal events clearly marked as private |
| **Messages** | Inbox | Show the teacher's subjects; "Message teacher" button on the course page |
| **Help** | Help | Fix the wrong sidebar highlight bug |
| (teacher) **Gradebook** | n/a | Grid: students × activities, inline scoring, component subtotals, Release button, CSV export |
| (admin) **School setup** | n/a | Years, terms, sections, subjects, policies, accounts, bulk import |

**Every course, activity, attempt, and thread has its own URL.**
Pattern: `/courses/:courseId`, `/courses/:courseId/activities/:activityId`, `/grades/:termId/:courseId`. The browser Back button must work, and notifications must link to these URLs.

Virtual Classroom: all four tabs were empty today. Don't rebuild it until the school confirms it's used; a `live_class` activity with a meeting link is the fallback.

## 6. Visual language (from the current brand)

Keep the school identity; drop the generic Metronic look.

```css
--brand-magenta: #D6336C;  /* script wordmark + logo ring (sample from the real logo file) */
--brand-green:   #4A8645;  /* lesson-player breadcrumb bar + logo laurel */
--ink:           #1E1E2D;  /* old sidebar navy, use for text and dark surfaces */
--primary:       #3B6FE0;  /* actions */
--success:       #1BA99F;  /* graded / outstanding */
--warning:       #F2A20C;  /* due soon / late */
--danger:        #E5484D;  /* missing / below 75 */
--info:          #3B82F6;  /* submitted */
--surface:       #F5F6FA;  --card: #FFFFFF;
font-family: Poppins, system-ui, sans-serif;  /* already in use */
```

- Body text **≥ 15px**, contrast **≥ 4.5:1**. (The current site uses light grey ~12px text; don't copy that.)
- **Mobile first**: bottom tab bar on phones; tables become stacked cards below 640px.
- Empty states get an illustration/icon + one sentence + an action. Never use the bare "[ No … found ]".
- Every async area shows skeleton loaders (the current PDF embed shows a blank grey box).
- Wordmark: use the school's script logo image. Don't try to recreate it in a font.

## 7. Copy and language

- Standardize labels: "Quiz", "Assignment", "Lesson", "Performance Task", "Written Work", "Quarterly Assessment".
- Watch plurals: "1 quiz", "2 quizzes".
- Content is English + Filipino; the UI is English. Never truncate Filipino titles without a tooltip or wrap.
- Dates: `Oct 6, 2026 · 9:05 PM` (Asia/Manila). Relative time only for anything under 7 days ("due in 2 days").

## 8. Definition of done (check each screen before calling it done)

- [ ] Works at 360px width and at 1440px
- [ ] Has its own URL; refreshing the page restores the same state
- [ ] Every gradable item uses a §3 status, with no blank cells
- [ ] No completion % that could be mistaken for a grade (§4.2)
- [ ] Empty, loading, and error states are designed
- [ ] Role checks happen on the server; parents and students only see released grades
- [ ] Keyboard navigable, 4.5:1 contrast, labels on icon buttons
- [ ] Compared against the matching `screens/*.jpg` so no existing feature is silently dropped

## 9. Tech stack (approved 2026-10-06)

Solo developer + Claude, so keep it to **one Next.js app**: no monorepo, no microservices.

| Layer | Choice |
|---|---|
| App | **Next.js (App Router) + TypeScript strict**, React Server Components for reads |
| UI | **shadcn/ui + Tailwind CSS + lucide-react**; theme tokens from §6 go in `globals.css` |
| API | **REST** via Route Handlers at `/api/v1/*`; OpenAPI generated from Zod schemas. **All writes go through REST.** No Server Actions that do things the API can't |
| Validation | **Zod**, with schemas in `src/lib/schemas/` shared by forms and the API |
| DB | **PostgreSQL** + **Drizzle ORM** + drizzle-kit migrations (committed, never `push` in prod) |
| Auth | **Better Auth**: username = student number + password; roles: student, parent, teacher, adviser, admin. Google SSO can be added later |
| Authorization | One `can(user, action, resource)` layer in `src/server/authz/`; every route handler calls it |
| Tables | **TanStack Table** (gradebook, reports) |
| Client data | **TanStack Query** for interactive views (gradebook inline edit) |
| Forms | React Hook Form + Zod |
| Charts | shadcn Charts (Recharts) |
| Calendar | FullCalendar |
| Rich text | Tiptap |
| Files | **Local disk** on the VPS (`/var/lib/ajvlms/uploads`) behind a `storage` interface in `src/server/storage/` (`put/get/delete/signedUrl`), so it can move to Cloudflare R2 later without code changes. Downloads go through an authorized route (Nginx `X-Accel-Redirect`), never a public folder |
| PDF | react-pdf (pdf.js) with skeletons |
| Jobs | **pg-boss** (notifications, grade recalculation, emails) |
| Email | SMTP (Hostinger mail or the school's) via Nodemailer |
| Notifications | `notifications` table + SSE endpoint |
| Testing | **Vitest** (grade engine: 100% coverage, table-driven) + **Playwright** (main flow for each role) |
| Observability | pino logs + Sentry |
| Tooling | pnpm, ESLint + Prettier, Husky, GitHub Actions CI |

### Hosting: Hostinger **KVM VPS** (not shared/Cloud hosting, which has no PostgreSQL). **No Docker.**
- KVM 2 or higher, **Singapore** data center, plain Ubuntu LTS.
- Installed directly: **Node.js LTS + pnpm**, **PostgreSQL**, **Nginx** (reverse proxy + Let's Encrypt via certbot), **PM2**.
- PM2 runs two processes from `ecosystem.config.js`: `web` (`next start`) and `worker` (pg-boss jobs).
- Deploy script `scripts/deploy.sh`: `git pull → pnpm install --frozen-lockfile → pnpm db:migrate → pnpm build → pm2 reload ecosystem.config.js`.
- Postgres listens on localhost only; UFW firewall allows only 22/80/443; SSH key login only.
- Nightly cron: `pg_dump` + uploads folder copied **off the VPS** (Cloudflare R2 or Backblaze B2), keep 30 days, test restoring once a month.
- **Local dev (Windows):** PostgreSQL for Windows installed natively, `pnpm dev`, uploads to `./.uploads`. Keep the same major Postgres + Node versions as the server (pin them in `.nvmrc` and the README).

### Non-negotiables
1. **Grade engine** lives in `src/server/grades/` as pure functions (no DB calls), fully unit-tested. On release, store a **snapshot** of computed grades so later edits never silently change a released grade.
2. **Audit log** for every grade/score change (who, when, old → new). Needed for disputes and RA 10173 (Data Privacy Act) compliance.
3. Every page has its own URL (§5).

### Scale: ~500 students (plus their parents and ~30–50 staff)
Small for a single VPS. The risk is **spikes**, not totals: everyone opens Grades within minutes of a release, or of report-card day.
- **Precompute, don't recompute.** When grades are released, write the results to a `grade_snapshot` table (one row per student × course × term). The Grades page is then **one indexed query**: no weighting math at request time.
- **Indexes required** on `(student_id, term_id)` for snapshots and on `(activity_id, student_id)` for submissions. Check every list query with `EXPLAIN` before merging.
- **Pool:** `max: 10` per process (web + worker = 20). Don't raise it without a reason.
- **Sessions:** Better Auth cookie cache (5 min) so page loads don't each hit the session table.
- **Release in the background.** "Release grades" queues a pg-boss job (snapshot + notifications) and returns immediately; notifications go out in batches.
- **Accounts:** creating 500 accounts by hand is not an option. Admin **CSV import** (student no., name, section, guardian email) is a P0 feature, along with **bulk password reset** that prints a slip per student.
- **Load test before launch:** simulate 500 logins + grade views in 5 minutes (k6 or autocannon). Target p95 < 500 ms on KVM 2.

### Folder layout
```
src/
  app/(auth)/login
  app/(student)/home, courses, grades, calendar, messages
  app/(teacher)/gradebook, courses/[id]/edit
  app/(admin)/setup
  app/api/v1/**/route.ts
  components/ui        (shadcn)   components/lms   (StatusChip, GradeBadge, ProgressBar…)
  server/db (drizzle schema)  server/authz  server/grades  server/jobs
  lib/schemas (zod)
```

## 10. Open decisions (don't invent answers; ask the user)

Grading weights & transmutation · term vs quarter · attempt rule · parent accounts · report card generation · keep or drop virtual classroom · migrating data from Gascloud. See `docs/AUDIT.md` §6.
