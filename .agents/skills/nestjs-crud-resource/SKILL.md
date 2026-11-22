---
name: nestjs-crud-resource
description: Scaffolds a new CRUD resource in an already-set-up NestJS 12 (ESM) backend on MongoDB with Prisma 6, Zod validation, the project's response envelope, pagination, Swagger docs, and cookie JWT auth. Use when adding a new CRUD resource or endpoint to an existing project.
license: MIT
compatibility: NestJS 12 (ESM), Prisma 6.19 / MongoDB, Zod 4.2+, bun. Requires the one-time setup from the nestjs-backend-setup skill.
---

# NestJS 12 CRUD resource

Add one resource end to end: interview → Prisma model → Zod schemas → service → controller → module → verify.

**Setup is assumed.** This skill does not create env validation, `PrismaModule`, the response envelope, the exception filter, Swagger, or auth — the `nestjs-backend-setup` skill owns those. If `src/prisma/`, `src/common/`, or `src/config/` is missing, stop and tell me to run the setup skill instead. Do not re-run setup here.

## Before you start

Read `prisma/schema.prisma`, `src/app.module.ts`, and one existing resource folder to copy its conventions. Do not touch the shared foundation files.

## Hard rules

- **Interview me first.** Never scaffold before Step 1 is answered and confirmed.
- **STOP and ask before any destructive database change:** dropping a collection, removing/renaming a field or model with data, changing a field type, adding `@unique` to a possibly-duplicated field, removing an index.
- Never pass `--accept-data-loss` or `--force-reset` to Prisma. If `prisma db push` warns or asks, **STOP and ask**.
- Never run seeds (`prisma db seed`) or write data unless I explicitly ask.
- Never run raw queries (`$runCommandRaw`, `$queryRaw`, `$executeRaw`, `mongosh`) and never write scripts that call PrismaClient. Test through curl against existing endpoints.
- Never print, log, or commit `DATABASE_URL` or `JWT_SECRET`.
- Validation is **Zod only**. Do not install or use class-validator, class-transformer, or `@nestjs/mapped-types`. Do not create DTO/entity classes.
- Every Zod schema lives in a `*.validation.ts` file. Never inline one in a module, controller, or service.
- Keep Prisma on **v6**. Re-check the Prisma docs before upgrading.

## ESM conventions (every file)

- Relative imports end in `.js` (`import { X } from './x.js'`), including `'../generated/prisma/client.js'`.
- No `__dirname`/`require`; use `import.meta.dirname`.
- Import a resource's validation module as a namespace: `import * as BlogDto from './blog.validation.js'`. Schema and type share one name (`Create`, `Update`, `ListQuery`, `Item`), so `BlogDto.Create` is both. This avoids TS1272 under `isolatedModules`.

## Response shapes

Every response must be gone through the response interceptor: `src/common/interceptors/response.interceptor.ts`

## Workflow

1. **Interview me.** Read `prisma/schema.prisma` first: if a model for the resource already exists, base the fields on it. Then confirm the resource name, access per operation (public / authenticated / admin), list sort whitelist, and search field. Summarize back and wait for confirmation.
2. **Messages** — `src/<resource>/<resource>.messages.ts` with `LIST_FETCHED`, `FETCHED`, `CREATED`, `UPDATED`, `DELETED`, `NOT_FOUND`.
3. **Check the Prisma schema, don't assume a model.** Look for a model for this resource. If it exists, use it as-is and match its fields. If it does **not** exist, STOP and interview me for the model (fields, types, relations, indexes), then add it from my answers — never from a template. Then `bunx prisma format && bunx prisma validate && bunx prisma db push`; stop on any warning.
4. **Validation** — `<resource>.validation.ts` exporting `Create`, `Update`, `ListQuery`, `Item` (schema + inferred type under the same name).
5. **Service** — Prisma queries only, `orNotFound` for misses, `Paginated` for lists. No HTTP concerns or wording.
6. **Controller** — no try/catch, no PrismaService. Every handler has `@ResponseMessage(...)` and `@ApiEnvelope(...)`. The global guard and `@Public()` already exist from setup.
7. **Module** — register controller + service; add it to `src/app.module.ts` imports.
8. **Verify the resource you just created** — derive the route from its `@Controller`, send a real payload from its `Create` schema, then create → read → update → list → delete and assert its own `messages.ts` strings. Do not use a hardcoded example route.

Code for steps 2–7: [references/resource-scaffold.md](references/resource-scaffold.md). It uses `<Resource>`, `<resource>`, `<RESOURCE>`, `<resources>` and field placeholders — replace every one with the interviewed names, including the Prisma delegate (`model Blog` → `prisma.blog`).
Verification: test all the endpoints you created end to end with curl, with checking all the velidations and rules — also derive the route/payloads from the new resource, never a hardcoded example.

## Rules to remember

- Check prisma/schema.prisma before scaffolding; if the model is missing, ask and interview
- Prisma stays v6
- Schema changes use db push, never migrate
- No --accept-data-loss / --force-reset; stop on warnings
- No raw queries, seeds, or PrismaClient scripts
- Zod via @Body/@Query/@Param({ schema })
- Import validation as a namespace; schema + type share one name
- No DTO/entity classes
- Every handler has @ResponseMessage + @ApiEnvelope
- Messages live in <resource>.messages.ts
- Success in a response = a missing decorator
- Clients branch on status/success/errorCode, never message
- Services return data/Paginated or throw; controllers return plain data
- No PrismaService in controllers
- orNotFound for lookups/updates/deletes
- Sort fields are whitelisted enums; search uses contains |
