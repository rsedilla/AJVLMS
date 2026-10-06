# AJV Learning Portal: Design Brief (for Claude Design)

**What:** a new learning portal for Academia de Julia Victoria (Catholic K–12 school, Bacoor, Cavite) replacing a generic hosted LMS.
**Who:** ~500 students (Grades 7–10 first), their parents/guardians, ~30–50 teachers, registrar/admin.
**Devices:** mostly **phones** for students and parents; laptops for teachers grading.
**Build target:** Next.js + **shadcn/ui + Tailwind CSS**. Please deliver the design as **tokens** (colors, type scale, radius, spacing, shadows) + **components** + **screens**, so it maps 1:1 onto shadcn theming (`--primary`, `--muted`, etc.) and doesn't need custom CSS per page.

> The old system's screenshots are a **reference, not a template**. Each element below is marked keep / improve / replace **on purpose**. Don't recreate the old look by accident (Metronic admin style: dark icon sidebar, grey-on-white tables, boxed widgets with inner scrollbars).

---

## 1. Goals in one line each
1. **"How am I doing?"**: a student or parent sees current grades per subject in **one screen**.
2. **"What do I need to do next?"**: due-soon and missing work is the **first thing** on Home.
3. **Feels like AJV**, not like software: school crest, colors, campus photo.
4. **Readable on a phone in sunlight**: high contrast, body text ≥ 15–16px.

## 2. Brand
| Asset | Notes |
|---|---|
| School crest | Round crest, pink/magenta ring with green laurel and a torch. Use the official file (to be provided by the school) |
| Script wordmark "Academia de Julia Victoria" | Pink/magenta script. Use as an image, not a font recreation |
| Colors seen in brand | Magenta/pink (wordmark, crest ring), leaf green (laurel), plus supporting blues/teal for UI states. **Fine-tune freely** |
| Campus photo | The school building, used on the old login. Good candidate for login and empty states |
| Font | Old system used Poppins. **Designer's choice** |

## 3. Keep / improve / replace

### ✅ Keep (it works)
| Element | Old system | Why it works | Direction |
|---|---|---|---|
| School identity | Crest, pink script wordmark, green | The school's own brand; families recognize it | Core of the new look |
| Login with campus photo | Card over the school building photo | Feels like *their* school | Keep; better contrast; mobile-first |
| Course cards with cover images | Grid of cards: image, title, dates, progress | Subjects are found by picture faster than by name | Add **next due item** + **missing count**; progress must not look like a grade |
| Course page structure | Cover + teacher + dates; tabs: Overview / Activities / Announcements / Notes | Clear, familiar | Add **Grades** tab + **Message teacher** button |
| Activity type icons | Chart = quiz, upload = assignment, stack = lesson | Instantly scannable | Keep; add a **status chip** beside each |
| Lesson focus mode | Full-screen, course breadcrumb bar, slide-in list of lessons | No distractions while studying | Keep; loading skeleton for PDFs; works on phones |
| Assignment page | Instructions → rubric → deadline banner → score → feedback thread → upload | Best screen in the old system | Keep the order; fix the faded text; show "late request" option after deadline |
| Quiz review | Correct answers in green, time answered | Students learn from mistakes | Full page (not a popup); mark wrong answers too; link from Grades |
| Big-number summary strip | 4 large colored numbers in a row | Readable at a glance | Use meaningful numbers: average, missing, due this week |
| Calendar color meaning | Teal = opens, pink = closes | Good idea | Map colors to the status vocabulary (§5) |
| Messages | Two-pane: contacts left, chat right | Universal pattern | Show each teacher's **subject(s)** |
| Profile | Profile card + sub-sections (personal, account, password) | Fine | Keep |
| Help | FAQ accordion with screenshots + video tutorials | Useful for parents | Keep |

### ❌ Replace (the cause of the complaints)
| Element | Old system | Problem | Direction |
|---|---|---|---|
| Home / dashboard | 6 boxed widgets, each with its own scrollbar; "learning hours" first | Can't answer "what's due?" | **To-do-first Home:** Due soon → Missing → Newly graded → Today → Announcements |
| Grades | Hidden in Reports behind a dropdown + Submit | #1 complaint | Dedicated **Grades** screens (§4) |
| Completion shown like a grade | Big "100%" in bold teal | Misleading: 100% complete ≠ 100% score | Completion: small, neutral ("8 of 12 done"). Grade: its own prominent treatment |
| Reports filter | Dropdown + select + Submit button | Too many clicks | Tabs + instant filters |
| Phone navigation | Fixed dark icon sidebar | Cramped on small screens | Desktop: sidebar is fine. Phone: designer's choice (bottom bar suggested) |
| Text | Light grey, ~12px | Hard to read | Contrast ≥ 4.5:1, body ≥ 15–16px |
| Empty states | "[ No schedule found ]" | Looks broken | Icon/illustration + one sentence + an action |

## 4. Screens to design (priority order)

**P0: must have for launch**
1. **Login** (student number + password; "forgot password → ask your adviser")
2. **Home (student)**: due soon, missing, newly graded, today's classes, announcements
3. **Grades: term overview**: one row/card per subject: grade, descriptor, trend, missing count
4. **Grades: subject detail**: components with weights (e.g. Written Work 30% · Performance Tasks 50% · Quarterly Assessment 20%); each item: status, score `18/20 · 90%`, feedback preview
5. **Courses list** and **Course page** (tabs incl. Grades)
6. **Activity pages**: lesson (focus mode), assignment (with submission), quiz (taking + review)
7. **Teacher gradebook**: grid of students × activities, inline score entry, component subtotals, **Release grades** button. *Laptop-first.*
8. **Parent home**: switch between children; same Grades screens, read-only

**P1**
9. Calendar (month/week/agenda; agenda is the default on phones)
10. Messages
11. Notifications (bell + full list)
12. Profile & settings
13. Admin: CSV import of students, sections, bulk password reset (simple; function over form)

**P2:** Help, announcements composer, course setup for teachers

## 5. Status vocabulary (must look identical everywhere)
Every gradable item shows exactly one of these. Please design one **status chip** with a color + icon + text (never color alone):

`Not started` · `Due soon` · `Submitted (awaiting grade)` · `Graded` · `Late` · `Missing` · `Excused` · `Locked`

Grade descriptors (DepEd style, to confirm with the school): Outstanding (90–100) · Very Satisfactory (85–89) · Satisfactory (80–84) · Fairly Satisfactory (75–79) · Did Not Meet Expectations (<75).

## 6. Components we know we need
Status chip · Grade badge (score + %, descriptor) · Completion bar (neutral) · Course card · Activity row (type icon + title + due + status) · Summary number tile · Page header with breadcrumb · Empty state · Skeleton loaders · Data table (also as stacked cards on phones) · Child switcher (parents) · Notification item · File upload drop zone · Rubric table · Feedback thread.

## 7. Every screen needs these states
Loading (skeleton) · Empty · Error (with retry) · Phone (360px) · Laptop (1440px). Optional: dark mode.

## 8. Constraints from engineering
- Use shadcn/ui primitives where possible; customize through **tokens**, not one-off styles.
- No information conveyed by color alone (accessibility + color-blind students).
- Tables must collapse to cards below ~640px.
- Text content is English + Filipino; long Filipino titles must wrap, not truncate.
- Real student data never appears in mockups; use fictional names.
