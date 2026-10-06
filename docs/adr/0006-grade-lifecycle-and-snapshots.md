# 0006. Grade lifecycle and snapshots

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
The old system had no course or term grade, showed half-checked scores, and wasn't built for 500 students opening grades at the same moment.

## Decision
- Lifecycle **Draft → Released → Finalized.** Corrections after release are visible ("Updated <date>") with history kept; after finalization only principal-approved change requests.
- On release/correction a background job computes **snapshots** (student × course × term) with the pure grade engine; pages read snapshots only.
- The grading policy is versioned; each snapshot records its version. Round once, at the end. Missing work counts as 0 only after the teacher marks it Missing.

## Consequences
- The Grades page is one indexed query, which handles release-day spikes.
- Past terms never change when the policy changes.
- The engine needs 100% test coverage with worked examples.

## Alternatives considered
- **Compute on every page view:** simpler, but slow under spikes, and results could drift silently.
