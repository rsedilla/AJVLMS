# 0003. Hostinger VPS without Docker

- **Status:** Accepted
- **Date:** 2026-10-07

## Context
The school will host on Hostinger. Shared/Cloud web hosting has no PostgreSQL. The solo developer works on Windows and preferred not to learn or run Docker.

## Decision
A Hostinger **KVM VPS** (KVM 2+, Singapore) running Ubuntu with Node.js, PostgreSQL, Nginx (+ Let's Encrypt) and PM2 installed directly. Local development uses native PostgreSQL on Windows. Uploads go to local disk behind a storage interface. Nightly encrypted backups are copied off the server.

## Consequences
- Fewer moving parts; no container knowledge needed.
- Laptop and server versions must be kept in step manually (Node pinned in `.nvmrc`, PostgreSQL 16 on both).
- Moving servers means reinstalling the stack (to be documented in a deploy guide).

## Alternatives considered
- **Docker Compose:** identical environments, but extra tooling, RAM and learning on Windows.
- **Coolify:** a Docker dashboard; declined to keep the stack minimal.
- **Vercel + managed DB:** easiest deploys; data spread across vendors, cost grows with use.
