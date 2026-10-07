# 0009. Calendar dates use `date`; instants use `timestamptz`

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
Rule D2 said "`timestamptz`, UTC, shown Asia/Manila". The school feature stores school-year and term boundaries ("Term 1 starts June 8"). Those are **calendar days in Manila**, not moments in time. Stored as `timestamptz` at UTC midnight, June 8 becomes 8:00 AM June 8 in Manila. A boundary stored as Manila midnight shows up as June 7 in UTC tooling. Either way, it's an off-by-one waiting to happen.

## Decision
- **Instants** (something happened at a moment: submitted, graded, released, signed in, archived) → `timestamptz`, stored in UTC, displayed in Asia/Manila.
- **Calendar days** (a whole school day with no time: school year and term start/end, a holiday, a due *date* with no time) → `date`, interpreted as a Manila calendar day. In JSON they're ISO dates (`"2026-06-08"`).
- A deadline with a time ("due 11:59 PM") is an instant → `timestamptz`.

## Consequences
- No timezone shifts on dates that have no time.
- Comparing "is now inside Term 1?" means converting *now* to a Manila date first; helpers in `src/lib` will do this.

## Alternatives considered
- **`timestamptz` for everything:** consistent, but every calendar day then needs a convention about which moment represents it, which is a classic source of off-by-one-day bugs.
