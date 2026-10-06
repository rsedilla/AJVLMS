# 0001. Next.js with a REST API; no Server Actions

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
One developer (with Claude) is building a web app for ~500 students, their parents and staff. A parent or mobile app may come later. Next.js offers two ways to change data: REST route handlers and Server Actions.

## Decision
Next.js App Router + TypeScript. **All writes go through REST route handlers under `/api/v1`.** No Server Actions. Server pages read by calling feature services directly; read endpoints are added only when a screen or app needs one.

## Consequences
- One write path to secure, test and audit; a future mobile/parent app reuses it unchanged.
- Slightly more code per form than Server Actions (a fetch + a route handler).
- Reads stay fast (no HTTP hop from server pages to our own API).

## Alternatives considered
- **Server Actions for writes:** less code, but not a public API, so a mobile app would need a second write path.
- **Pages read through our own REST API:** discouraged by the Next.js docs; slower and error-prone with cookie forwarding.
