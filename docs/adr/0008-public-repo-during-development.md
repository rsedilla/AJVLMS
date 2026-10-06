# 0008. Public repository during development

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
The owner wants the repository public during development and private when the app goes live. Anything pushed to a public repo should be treated as permanently public (forks, clones, archives, git history).

## Decision
- The repo may be public. **Code is public; data never is.** No real student data, screenshots, rosters or secrets are ever committed.
- Enforced by `.gitignore` (`screens/`, `.env`, `data/private/`), `scripts/check-staged.mjs` (pre-commit), a CI forbidden-files step, gitleaks, and GitHub secret scanning with push protection.
- Commits use the GitHub noreply email.

## Consequences
- Security must never depend on hidden code: secrets live in `.env`, permission checks on the server.
- Mockups and fixtures use fictional names only.

## Alternatives considered
- **Private from day one:** safer by default; the owner chose public for now.
