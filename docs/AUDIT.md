# AJV LMS — System & Process Audit

**System:** GascloudLMS at acadjuliavictoria.gascloud.tech
**Date:** 2026-10-06
**Basis:** 38 screenshots in `/screens` (kept local only: contains real student data) taken while signed in as one Grade 8 student (section Rizal).

> **Evidence levels used below**
> - ✅ **Observed**: seen directly on screen
> - 🔎 **Inferred**: deduced from what the student side shows (e.g. a teacher name on feedback means teachers grade inside the LMS)
> - ❓ **Unknown**: needs a teacher/admin account or a conversation with the school to confirm

---

## 1. Executive summary

The system can deliver content (lessons, PDFs, assignments, quizzes, a calendar, messaging), but it is weak at the thing students and parents care about most: **"How am I doing, and what do I need to do next?"**

The top three problems:

1. **There is no Grades page.** Scores are split across 4 places (Reports → Assignment view, Reports → Quizzes view, each assignment page, the quiz review modal). None of them shows a course grade, a term grade, or how scores are weighted.
2. **"Progress %" looks like a grade but only measures completion.** A course can show *100%* while its quiz scores are 2/10 and 5/10. Students, and especially parents, will misread this.
3. **There is no single "to-do" view.** Deadlines live in the Calendar, missed and pending quizzes appear only as numbers on the Dashboard, and you can't click through from those numbers to the actual items.

---

## 2. How students use the system ✅

### Journey S1: "What do I need to do today?"
| Step | What the student does | Friction |
|---|---|---|
| 1 | Logs in and lands on the **Dashboard** | The biggest number is *Total Learning Hours* (35 hrs), which doesn't help them decide what to do |
| 2 | Sees "Pending: 1 Quizzes", "Missed: 1 Quizzes" | **Not clickable.** No way to tell which quiz or which course |
| 3 | Opens **Calendar** to find deadlines | Events are "Start date of…" / "Closing date of…" text blobs; busy days collapse into "+3 more" |
| 4 | Opens **Courses** and scans 13 cards | Cards show completion % and course dates, but not the next deadline or anything overdue |
| 5 | Opens a course → **Activities** | Flat list of 13+ items with no status (done / due / late / graded), except the ✓ on lessons |

**It takes about 5 screens to answer "what's due?", and it still can't answer "what did I miss?"**

### Journey S2: "Do a lesson"
Courses → VIEW → Activities → expand group → click lesson → **full-screen player** (PDF embed, side panel with Activities/Notes/Settings).
- The PDF shows a blank grey box with no spinner until it loads.
- The browser URL never changes (`/courses`), so students can't bookmark a lesson, share a link to it, or use the browser's Back button.

### Journey S3: "Submit an assignment"
Course → Activities → assignment → read instructions and rubric → deadline banner → **Upload and Notes form** (file dropzone + rich text + Submit) → submission thread.
- ✅ Good: the rubric is shown, the deadline is clear, and teacher feedback shows up in a thread.
- ❌ After the deadline, the form fades out with "Uploading is no longer allowed!". There is no late-submission request path.
- ❌ The submission thread and the upload form are low-contrast (faded headings).

### Journey S4: "Check my grades" ⚠️ *(the main pain point, see §4)*
Reports → **View ▾** → Quizzes → scroll the long grouped table → find a score → click *[Review]* (only some rows have it).
Then repeat with View ▾ → Assignment. **There is no screen that adds this up per course.**

### Journey S5: "Message my teacher"
Inbox → choose from 6 faculty contacts → type → SEND.
- The contact list shows "Faculty 2026" / "Faculty", not **which subject** each teacher handles.
- You can't message from the course page, even though the teacher's name is shown there.

### Journey S6: "Join a virtual class"
Virtual Classroom → Schedule / Invites / Groups / History. All four were **empty** for this student. 🔎 Online classes probably happen elsewhere (the dashboard footer has a Zoom-style `/j/83666705473` link). ❓ Is this module used at all?

---

## 3. How teachers and admins use the system 🔎 (inferred, needs confirmation)

### Teacher (🔎 from what students see)
| Task | Evidence on the student side | Likely pain |
|---|---|---|
| Build a course: overview, cover image, hours, start/due | Course detail page fields | ❓ Can teachers copy last year's course (T1 → T2)? Course names like "T2 … SY 26-27" suggest everything is rebuilt by hand each term |
| Upload lessons (PDF embeds) | Lesson player, "Topic Outline (2nd Term)" | Mostly PDF uploads, little native content |
| Create quizzes: matching, fill-in-the-blank, T/F | Quiz review modal | ❓ Question bank? Randomization? Do they set how many attempts are allowed? (one student has 2 attempts on "Maikling Pagsusulit 1.2") |
| Grade assignments with a score + written feedback | 18/20 badge, feedback by "Teacher A" | Grading is per item. 🔎 There is probably no gradebook grid, which would explain why most assignment Score cells are blank |
| Post announcements and notes | Announcement and Notes tabs | Both empty in every course checked, so these features are probably not used |
| Communicate | Inbox | One-to-one only. 🔎 No class-wide broadcast |
| Compute term grades | **Nothing in the LMS** | 🔎 Teachers probably export or copy scores into a spreadsheet or school system to compute the DepEd-style grade. **This duplicated work is the root cause of the grades problem** |

### Admin / Registrar (🔎)
| Task | Evidence | Likely pain |
|---|---|---|
| Create student accounts (username = student no. `2099-0001`) | Profile → Account Info | ❓ Bulk import? Password reset flow? (FAQ has a "forgot password" topic, which suggests it's done by hand) |
| Assign students to section/grade (Rizal, Grade 8) | Profile card | |
| Create courses per section per term and assign teachers | Course names include section + term | 13 courses for one student, all named by hand, with inconsistent naming ("T2 - Math 8 Rizal", "MAPEH 8 RIZAL T2", "T1 Science 8 26-27") |
| Manage calendar | Start/Closing events are generated from activities | |
| Report cards | **Not in the LMS** ❓ | |
| Parent access | **None seen** ❓ | Parents probably rely on the student's login, or have no access |

### Roles we're missing ❓
- **Parent/Guardian**: the most likely group to complain about seeing grades
- **Adviser / Homeroom teacher**: "T1 HOMEROOM / CONDUCT 8" is set up as a *course*, which suggests the system has no adviser role and conduct grades are forced into the course model

---

## 4. Deep dive: how students view grades

### 4.1 Where grade information lives today ✅
| Location | What it shows | What's missing |
|---|---|---|
| Dashboard → "Courses Completed" | Completion % per course | Not a grade, but it *looks* like one |
| Dashboard → "Assignments Completed" | Total / Done counts | No scores |
| Dashboard → "Quizzes Completed" | Finished 15 / Pending 1 / Missed 1 / Locked 0 | Not clickable, no scores |
| Reports → Summary (default) | One course only (MAPEH T2) + item list | Requires dropdown + **Submit** |
| Reports → Assignment view | Course progress bar + item rows + Score + Remarks | **Score blank for almost every item.** Can't tell *not graded yet* from *not submitted*. Remarks always empty |
| Reports → Quizzes view | Score + date submitted, *[Review]* on some | Repeat attempts show as **duplicate rows** (2/10 and 5/10 both listed) with no "counts toward grade" marker |
| Assignment page | 18/20 badge + teacher feedback | Only reachable by digging into the course |
| Quiz review modal | Answers with correct/incorrect highlighting | Good, but only reachable from Reports |

### 4.2 Problems, ranked
| # | Problem | Impact | Severity |
|---|---|---|---|
| G1 | **No course grade or term grade anywhere**, and no weighting (Written Work / Performance Task / Quarterly Assessment) | Students and parents can't tell if they're passing until report cards come out | 🔴 Critical |
| G2 | **Progress % (completion) shown in the same visual style as a grade** | "100%" in Math when no quizzes were taken. Wrong signal | 🔴 Critical |
| G3 | **Scores are split across 4 screens** and need a dropdown + Submit to find | Too much effort, so students don't check | 🟠 High |
| G4 | **Blank score means 4 different things** (not submitted / submitted, not graded / graded 0 / not applicable) | Anxiety and lots of "Ma'am, did you check my work?" messages | 🟠 High |
| G5 | **Multiple quiz attempts listed with no rule shown** (highest? latest? average?) | Disputes | 🟠 High |
| G6 | **Feedback isn't visible next to scores** (lives only inside the assignment thread) | Feedback goes unread, so students don't learn from it | 🟡 Medium |
| G7 | **No "graded" notification** (bell said "All caught up!" earlier, later showed 2 with no grade context) | Students miss new grades | 🟡 Medium |
| G8 | **Scores aren't color-coded or shown as %** (2/10 looks exactly like 10/10) | Hard to scan | 🟡 Medium |
| G9 | **Missed/Pending/Locked counts can't be clicked** | Can't act on them | 🟡 Medium |
| G10 | **No parent view** ❓ | Parents ask the school or log in as the student | ❓ Confirm |

### 4.3 What a good grades experience looks like (target)
1. A top-level **"Grades"** item in the main navigation.
2. A **term overview**: one row per subject → current grade, transmuted grade, pass/fail band, trend arrow, count of missing items.
3. A **subject drill-down** showing components with their weights:
   `Written Work 30% · Performance Tasks 50% · Quarterly Assessment 20%` *(weights per subject, set by the school; see §6)*
   Each item: status chip → score → % → feedback preview → link to the item.
4. **Clear status vocabulary** for every gradable item:
   `Not started · Submitted – awaiting grade · Graded · Late · Missing · Excused`
5. **Attempt rule shown** on quizzes ("Highest of 2 attempts counts").
6. **Completion is shown separately** from grade, as a thin bar labelled *"Completed 8 of 12 activities"*, never as a big %.
7. **"Released" control** for teachers: grades appear to students only when the teacher publishes them. This prevents half-graded panic.
8. **A notification + dashboard card** when something is graded: "Math 8 · Quiz 2.1 graded: 9/10".
9. A **parent view**: read-only, the same Grades screens, possibly showing several children.

---

## 5. Other findings (not about grades)

| Area | Finding | Severity |
|---|---|---|
| Navigation | Course, lesson, and assignment pages have **no URL of their own**: no deep links, Back button leaves the course | 🟠 High |
| Navigation | Help page highlights **Reports** in the sidebar (bug) | 🟢 Low |
| Dashboard | Six widgets each with **their own scrollbox**; course names cut off ("T2 English Lang…") | 🟡 Medium |
| Dashboard | Leads with Learning Hours, a vanity metric, instead of what's due next | 🟡 Medium |
| Courses | T1 and T2 courses mixed together; filter says "1st Quarter…" while names say "T1/T2" (**term vs quarter mismatch**) | 🟡 Medium |
| Courses | No "next due item" on course cards | 🟡 Medium |
| Reports | View ▾ dropdown + select + **Submit** button is an outdated filter pattern | 🟡 Medium |
| Calendar | Events are long auto-generated sentences; "Start date of…" adds noise | 🟢 Low |
| Calendar | Students can **Add Event**: is that a personal calendar or does it go to the shared one? ❓ | ❓ |
| Inbox | Teacher's subject isn't shown; you can't message from a course | 🟢 Low |
| Virtual Classroom | All empty; possibly unused | ❓ |
| Profile | Personal data (address, phone, emergency contact) can be edited by the student without a visible approval step ❓ | ❓ |
| Profile | Typo "informaiton"; LRN empty | 🟢 Low |
| Accessibility | Low-contrast grey text on white throughout; small 12–13px body text | 🟠 High |
| Mobile | Fixed icon sidebar, wide tables (Reports): probably poor on phones, which most students use ❓ | 🟠 High (verify) |
| Lesson player | PDF embed has no loading state; Settings tab purpose unclear | 🟢 Low |
| Copy | "1 Quizzes", "Forget Password ?", inconsistent capitalization ("MAPEH 8 RIZAL T2" vs "T2 - Math 8 Rizal") | 🟢 Low |

---

## 6. Questions to answer before designing (for the school)

1. **Grading policy:** Does AJV use DepEd Order No. 8, s. 2015 component weights (WW / PT / QA, varying by subject) and the transmutation table? Or its own scheme? Is there a separate conduct grade?
2. **Terms:** Are "T1/T2/T3" trimesters or quarters? The UI uses both terms.
3. **Quiz attempts:** Which attempt counts: highest, latest, or average?
4. **Grade release:** Should students see each score right away, or only after the teacher releases it?
5. **Parents:** Should parents get their own login? Should one parent be able to see several children?
6. **Report cards:** Should the new system generate them (SF9 / school format), or only display grades?
7. **Virtual classroom:** Keep it, or replace it with links to Zoom/Meet?
8. **Data:** Can we export current data from Gascloud (students, courses, scores), or will we start fresh?
9. **Access:** Can we get a **teacher test account** and an **admin test account** so §3 can be verified?

---

## 7. Recommended priorities for the rebuild

| Priority | Item | Why |
|---|---|---|
| P0 | **Grades module** (student + parent views, teacher gradebook with weights + release) | Fixes the #1 complaint and removes the spreadsheet work teachers do on the side |
| P0 | **"To do" dashboard**: due soon / overdue / newly graded | Replaces 5-screen hunting with 1 screen |
| P0 | **Real URLs for every course/activity** | Basic usability; makes notifications and links work |
| P1 | Unified activity status model (see G4) | Used by grades, the dashboard, the calendar, and notifications |
| P1 | Mobile-first layout | Most students use phones |
| P1 | Teacher course copy (T1 → T2, year to year) | Saves hours of setup each term |
| P2 | Messaging from course context, announcements to the whole class | |
| P2 | Accessibility (contrast, font size) | |
| P3 | Virtual classroom (decide keep or drop) | |
