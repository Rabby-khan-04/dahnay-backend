---
description: Scaffold a NestJS CRUD resource (interview → Prisma model → Zod → service → controller → verify)
argument-hint: <ResourceName>
---

Use the `nestjs-crud-resource` skill for this task.

Resource to scaffold: `$ARGUMENTS`

The one-time setup (Prisma, response envelope, exception filter, Swagger, auth)
is assumed to be done. Do not run setup.

Start with the skill's Step 1 interview and wait for confirmation before writing
any code. Then follow:

1. `references/resource-scaffold.md` — messages, model, validation, service, controller, module
2. `references/verify.md` — curl verification
