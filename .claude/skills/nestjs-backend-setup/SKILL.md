---
name: nestjs-backend-setup
description: One-time foundation for a NestJS 12 (ESM) backend on MongoDB with Prisma 6, Zod env validation, the unified response envelope and exception filter, pagination helpers, Swagger, and httpOnly-cookie JWT auth. Use only when bootstrapping a new backend or when these foundations are missing, not when adding a resource.
license: MIT
compatibility: NestJS 12 (ESM, Node 20.19+/22.12+), Prisma 6.19 on MongoDB (Prisma 7 has no MongoDB support), Zod 4.2+, bun.
---

# NestJS 12 backend setup (one-time)

Run this **once**, when the project is new or the foundations are missing. Adding resources uses the `nestjs-crud-resource` skill and does not need this one.

## Check first — do not recreate what exists

Look for `src/prisma/prisma.service.ts`, `src/common/interceptors/response.interceptor.ts`, `src/config/env.validation.ts`, `src/auth/jwt-auth.guard.ts`, and `ConfigModule`/`PrismaModule` in `src/app.module.ts`. If they are present, stop and report that setup is already done.

## Hard rules

- **STOP and ask before any destructive database change:** dropping a collection, removing/renaming a field or model with data, changing a field type, adding `@unique` to a possibly-duplicated field, removing an index.
- Never pass `--accept-data-loss` or `--force-reset`. If `prisma db push` warns or asks, **STOP and ask**.
- Never run seeds or write data unless I explicitly ask. Never run raw queries (`$runCommandRaw`, `$queryRaw`, `$executeRaw`, `mongosh`).
- Never print, log, or commit `DATABASE_URL` or `JWT_SECRET`.
- Never send raw errors, stack traces, or database text to the client.
- Keep Prisma on **v6** (`prisma@6`, `@prisma/client@6`).

## What it creates

```
prisma/schema.prisma
src/
  generated/prisma/          # generated, git-ignored
  config/env.validation.ts
  prisma/                    # prisma.module.ts, prisma.service.ts, or-not-found.ts
  common/
    decorators/              # response-message, skip-response-wrapper
    filters/all-exceptions.filter.ts
    interceptors/response.interceptor.ts
    pagination/pagination.ts
    swagger/api-envelope.decorator.ts
    validation/object-id.ts
  auth/                      # cookie JWT guard + register/login/logout/me
```

## Steps

1. **Dependencies** — install `@nestjs/config`, `@nestjs/swagger`, `@nestjs/jwt`, `@prisma/client@6`, `zod`, `cookie-parser`, `bcryptjs`; dev `prisma@6`, `@types/cookie-parser`. Add `"postinstall": "prisma generate"`.
2. **Env** — ask for the MongoDB URI (with database name) and a JWT secret; write `.env`, `.env.example`, `.gitignore` entries. Prisma needs a replica set (Atlas works).
3. **Prisma** — write `prisma/schema.prisma` by hand (do not run `prisma init`), then `format`, `validate`, `db push`. Create `PrismaService`, `PrismaModule` (global), `orNotFound`.
4. **Common** — response message/skip decorators, pagination (`Paginated`, `pageArgs`, `toPaginated`), the response interceptor, the all-exceptions filter, the Swagger envelope decorator, the ObjectId validator.
5. **Env validation + AppModule** — Zod env schema, global `ConfigModule`, `PrismaModule`, register the response interceptor.
6. **main.ts** — cookie parser, `api` prefix, `StandardSchemaValidationPipe`, the exception filter, CORS, shutdown hooks, Swagger at `/api/docs`.
7. **Auth** — cookie JWT guard registered globally, `@Public()` opt-out, register/login/logout/me, secrets and timing-safe login.

Full code for steps 1–6: [references/project-setup.md](references/project-setup.md).
Auth code: [references/auth-cookie-jwt.md](references/auth-cookie-jwt.md).

## Verify

- The app boots with no missing env or provider errors.
- `GET /api/docs` renders.
- A probe route returns `{ success, message, data }`; a thrown error returns `{ success: false, message, errors }`.
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` behave per the auth reference.
- No response ever contains `passwordHash`.
