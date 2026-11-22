---
description: One-time NestJS backend setup (Prisma + MongoDB, envelope, filter, Swagger, cookie JWT auth)
argument-hint:
---

Use the `nestjs-backend-setup` skill.

Run it only if the foundation is missing: `src/prisma/`, `src/common/`,
`src/config/env.validation.ts`, or `src/auth/`. If they already exist, report
that setup is done and stop.

Follow the skill in order:

1. `references/project-setup.md` — deps, env, Prisma, common envelope, Swagger, main.ts
2. `references/auth-cookie-jwt.md` — cookie JWT guard and auth routes
