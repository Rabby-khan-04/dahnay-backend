---
name: nestjs-crud-resource
description: Scaffolds a NestJS 12 (ESM) + MongoDB (Mongoose) CRUD resource with Zod validation, a unified response envelope with per-endpoint messages, pagination, Swagger docs, and JWT cookie auth. Use when adding a new CRUD resource or endpoint, or setting up MongoDB, auth, or Swagger in a NestJS 12 backend.
compatibility: Requires NestJS 12, an ESM project ("type": "module"), Node 20.19+ or 22.12+, Zod 4.2+, and a MongoDB database (Atlas or local).
---

# NestJS 12 CRUD Resource Scaffold (ESM + Zod + MongoDB)

Follow the steps in order. Never skip the interview (Step 1) or the Hard Rules.

## Hard Rules

- STOP and ask me before anything destructive: dropping a collection, removing or renaming fields on existing data, changing a field type on existing data, removing an index.
- Never run seed scripts or write data to the database unless I explicitly ask.
- Never run raw database queries (no mongosh, no ad-hoc scripts). All data operations go through curl against existing endpoints.
- Never print, log, or commit the MongoDB URI or JWT secret. They live only in `.env`.
- Never send raw error messages, stack traces, or Mongo error text to the client.
- Do not install class-validator, class-transformer, or @nestjs/mapped-types. Validation is Zod only.
- Do not create DTO classes or abstract classes for request/response types. Zod schemas and their inferred types are the single source of truth.
- Never define a Zod schema inline in a module, controller, or service. Every schema lives in a `*.validation.ts` file (or the shared files under `src/common/` and `src/config/`).

## ESM + TypeScript conventions (apply to every file)

- Every relative import ends in `.js`: `import { X } from './x.js'`.
- No `__dirname` or `require`. Use `import.meta.dirname`. `main.ts` ends with `await bootstrap()`.
- Import a resource's validation file as a namespace, in controllers and services alike: `import * as BlogDto from './blog.validation.js'`. Schema and type share one name (`Create`, `Update`, `ListQuery`, `Item`), so `BlogDto.Create` is both the schema value and the type. Never import these by name: a type imported by name into a decorated signature causes TS1272 under `isolatedModules`.
- Check the Nest APIs against the Nest 12 docs when unsure. Do not guess from Nest 10/11 habits.

## Response shapes (never deviate)

- Success: `{ "success": true, "message": "Blog created successfully", "data": {...} }`
- Paginated: `{ "success": true, "message": "...", "data": [...], "meta": { page, limit, total, totalPages, hasNextPage, hasPreviousPage } }`
- Failure: `{ "success": false, "message": "...", "errors": [...], "errorCode": "BLOG_NOT_FOUND" }` (`errorCode` only when set)

## Folder layout

```
src/
  config/
    env.validation.ts         (Zod env schema + Env type)
  common/
    decorators/response-message.decorator.ts
    decorators/skip-response-wrapper.decorator.ts
    filters/all-exceptions.filter.ts
    interceptors/response.interceptor.ts
    pagination/pagination.ts
    swagger/api-envelope.decorator.ts
    utils/escape-regex.ts
    validation/object-id.ts
  <resource>/
    <resource>.entity.ts      (Mongoose schema)
    <resource>.validation.ts  (Zod schemas + inferred types)
    <resource>.messages.ts    (all message strings)
    <resource>.service.ts
    <resource>.controller.ts
    <resource>.module.ts
  auth/   (one-time, see Step 8)
```

## Step 0. One-time project setup (check first, skip what exists)

Check: `node -v` is 20.19+ or 22.12+, `package.json` has `"type": "module"`, `@nestjs/core` is ^12, and `src/common/` / `src/auth/` / `src/config/` do not already exist.

### 0.1 Dependencies

```bash
bun add @nestjs/mongoose mongoose @nestjs/config @nestjs/swagger @nestjs/jwt zod cookie-parser bcryptjs
bun add -d @types/cookie-parser
```

Use the project's package manager if it is not bun. bcryptjs v3 ships its own types. Read peer-dependency warnings: every @nestjs/\* package must support Nest 12.

### 0.2 MongoDB URI and env

- Ask me for the MongoDB connection string. If I have none, tell me to create a free cluster on MongoDB Atlas and copy the connection string (`mongodb+srv://<user>:<password>@<cluster>/<dbname>`). Ask for the database name if it is not in the URI.
- Write `.env`: `MONGODB_URI=...`, `JWT_SECRET=...` (ask me, or generate 48+ random chars), `JWT_EXPIRES_IN_SECONDS=604800`, `PORT=3000`, `NODE_ENV=development`.
- Make sure `.env` is in `.gitignore`. Create `.env.example` with the same keys and empty values.
- Every env var is declared in `src/config/env.validation.ts` (Step 0.4) and mirrored in `.env.example`. When a new env var is needed, update both.
- Do not echo the URI or secret back in chat.

### 0.3 Common building blocks

`src/common/decorators/response-message.decorator.ts`

```ts
import { Reflector } from "@nestjs/core";
export const ResponseMessage = Reflector.createDecorator<string>();
```

`src/common/decorators/skip-response-wrapper.decorator.ts` (for file downloads, streams, health checks, webhooks)

```ts
import { Reflector } from "@nestjs/core";
export const SkipResponseWrapper = Reflector.createDecorator<void, boolean>({
  transform: () => true,
});
```

`src/common/utils/escape-regex.ts`

```ts
export const escapeRegex = (input: string) =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
```

`src/common/validation/object-id.ts`

```ts
import { z } from "zod";
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
```

`src/common/pagination/pagination.ts`

```ts
import { z } from "zod";
import type { HydratedDocument, Model } from "mongoose";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// The interceptor detects this class with instanceof, so no duck-typing false positives.
export class Paginated<T> {
  constructor(
    public readonly items: T[],
    public readonly meta: PaginationMeta,
  ) {}
}

type Filter<T> = Parameters<Model<T>["find"]>[0];

export async function paginate<T>(
  model: Model<T>,
  filter: Filter<T>,
  query: PaginationQuery & { sortBy: string },
): Promise<Paginated<HydratedDocument<T>>> {
  const { page, limit, order, sortBy } = query;
  const dir = order === "asc" ? 1 : -1;
  const [items, total] = await Promise.all([
    model
      .find(filter)
      .sort({ [sortBy]: dir, _id: dir })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(), // _id tie-breaker keeps pages stable
    model.countDocuments(filter).exec(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return new Paginated(items as HydratedDocument<T>[], {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  });
}
```

`src/common/interceptors/response.interceptor.ts`

```ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, map } from "rxjs";
import { ResponseMessage } from "../decorators/response-message.decorator.js";
import { SkipResponseWrapper } from "../decorators/skip-response-wrapper.decorator.js";
import { Paginated } from "../pagination/pagination.js";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride(SkipResponseWrapper, targets))
      return next.handle();
    const message =
      this.reflector.getAllAndOverride(ResponseMessage, targets) ?? "Success"; // "Success" in a response means a decorator was forgotten
    return next
      .handle()
      .pipe(
        map((data) =>
          data instanceof Paginated
            ? { success: true, message, data: data.items, meta: data.meta }
            : { success: true, message, data: data ?? null },
        ),
      );
  }
}
```

`src/common/filters/all-exceptions.filter.ts`

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (res.headersSent) return;

    const e = exception as any;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errors: unknown[] = ["Internal server error"];
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === "string" ? body : (body as any).message;
      errors = Array.isArray(raw) ? raw : [raw];
      errorCode =
        typeof body === "object" ? (body as any).errorCode : undefined;
    } else if (e?.code === 11000) {
      status = HttpStatus.CONFLICT; // Mongo duplicate key
      errors = ["Resource already exists"];
    } else if (e?.name === "CastError") {
      status = HttpStatus.BAD_REQUEST;
      errors = ["Invalid id"];
    } else if (e?.name === "ValidationError" && e.errors) {
      status = HttpStatus.BAD_REQUEST; // Mongoose schema validation
      errors = Object.values<any>(e.errors).map((x) => x.message);
    } else {
      this.logger.error(exception); // log unexpected errors server-side only
    }

    const message =
      errors.length === 1 && typeof errors[0] === "string"
        ? errors[0]
        : "Validation failed";
    res
      .status(status)
      .json({
        success: false,
        message,
        errors,
        ...(errorCode && { errorCode }),
      });
  }
}
```

`src/common/swagger/api-envelope.decorator.ts` (documents the wrapped response; the interceptor hides it from Swagger otherwise)

```ts
import { applyDecorators } from "@nestjs/common";
import { ApiResponse, type ApiResponseOptions } from "@nestjs/swagger";
import { z } from "zod";

export const ApiEnvelope = (
  schema: z.ZodType | null,
  {
    status = 200,
    paginated = false,
  }: { status?: number; paginated?: boolean } = {},
) => {
  const data: Record<string, unknown> = schema
    ? (z.toJSONSchema(schema, {
        target: "openapi-3.0",
        io: "output",
      }) as Record<string, unknown>)
    : { nullable: true };
  return applyDecorators(
    ApiResponse({
      status,
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: paginated ? { type: "array", items: data } : data,
          ...(paginated && {
            meta: {
              type: "object",
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
                hasNextPage: { type: "boolean" },
                hasPreviousPage: { type: "boolean" },
              },
            },
          }),
        },
      } as ApiResponseOptions["schema"],
    }),
  );
};
```

### 0.4 Env validation and `src/app.module.ts`

`src/config/env.validation.ts` is the only place env vars are declared:

```ts
import { z } from "zod";

export const envSchema = z.object({
  // fails fast at boot if env is wrong
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().default(604800),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});
export type Env = z.infer<typeof envSchema>;
```

`src/app.module.ts`

```ts
import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { envSchema } from "./config/env.validation.js";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor.js";
import { AuthModule } from "./auth/auth.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("MONGODB_URI"),
      }),
    }),
    AuthModule,
    // feature modules are added here (Step 7)
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }],
})
export class AppModule {}
```

Optionally type the service as `ConfigService<Env, true>` for compile-time key checks. Verify it type-checks under Nest 12's stricter `ConfigService.get()` inference.

### 0.5 `src/main.ts`

```ts
import { NestFactory } from "@nestjs/core";
import { StandardSchemaValidationPipe } from "@nestjs/common"; // verify import path against Nest 12 docs / IDE autocomplete
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    routeConflictPolicy: { duplicate: "error", shadow: "warn" },
    routeResolutionStrategy: "specificity",
  });

  app.use(cookieParser());
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new StandardSchemaValidationPipe()); // without this, @Body({ schema }) does NOT validate
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: true, credentials: true }); // tighten origin for production

  const config = new DocumentBuilder()
    .setTitle("API")
    .setDescription("API documentation")
    .setVersion("1.0")
    .addCookieAuth("access_token")
    .build();
  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(app, config),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

Swagger UI is at `/api/docs`. Zod 4.2+ schemas are reflected into the document automatically. If schemas are missing in `/api/docs`, add a `standardSchemaConverter` to the `createDocument` options (see the "Standard Schema (Zod, Valibot)" section of the Nest OpenAPI docs).

## Step 1. Interview me about the resource

Before writing code, ask:

- Resource name (singular, e.g. `Blog`).
- Each field: name, type, required or optional, default, unique, min/max or enum values, references to other collections.
- Per operation (list, get, create, update, delete): public, authenticated, or admin-only?
- List endpoint: which fields can be sorted (whitelist), and which field is searched?
  Summarize the fields back as a short list and wait for my confirmation.

## Step 2. Messages: `src/<resource>/<resource>.messages.ts`

Every message string lives here. Wording is `<Resource> <past-tense action> successfully`, singular for one item and plural for lists.

```ts
export const BLOG_MESSAGES = {
  LIST_FETCHED: "Blogs fetched successfully",
  FETCHED: "Blog fetched successfully",
  CREATED: "Blog created successfully",
  UPDATED: "Blog updated successfully",
  DELETED: "Blog deleted successfully",
  NOT_FOUND: "Blog not found",
} as const;
```

## Step 3. Entity: `src/<resource>/<resource>.entity.ts`

```ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

export type BlogDocument = HydratedDocument<Blog>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) => {
      delete ret._id;
      return ret;
    },
  }, // exposes `id`, hides `_id` and `__v`
})
export class Blog {
  @Prop({ required: true, trim: true, index: true })
  title: string;

  @Prop({ required: true })
  content: string;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
```

Add `unique`, `enum`, `ref`, `select: false` per the interview. Any change to an existing entity that could affect stored data triggers the "STOP and ask" rule.

## Step 4. Validation: `src/<resource>/<resource>.validation.ts`

Zod is the single source for validation, types, and Swagger. Each schema and its inferred type share one name. Always use the names `Create`, `Update`, `ListQuery`, and `Item`. Consumers import the file as a namespace (`import * as BlogDto`).

```ts
import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination/pagination.js";

export const Create = z.strictObject({
  // strict: unknown keys are rejected
  title: z.string().trim().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

export const ListQuery = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt", "title"]).default("createdAt"), // whitelist, never free-form
  search: z.string().trim().min(1).optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const Item = z.object({
  // response shape, used for Swagger
  ...Create.shape,
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Item = z.infer<typeof Item>;
```

## Step 5. Service: `src/<resource>/<resource>.service.ts`

Database access only. No HTTP concerns, no response wording (messages come from the messages file).

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Blog } from "./blog.entity.js";
import { BLOG_MESSAGES } from "./blog.messages.js";
import * as BlogDto from "./blog.validation.js";
import { paginate } from "../common/pagination/pagination.js";
import { escapeRegex } from "../common/utils/escape-regex.js";

@Injectable()
export class BlogService {
  constructor(@InjectModel(Blog.name) private readonly model: Model<Blog>) {}

  findAll(query: BlogDto.ListQuery) {
    const { search, ...paging } = query;
    const filter = search
      ? { title: { $regex: escapeRegex(search), $options: "i" } }
      : {};
    return paginate(this.model, filter, paging);
  }

  async findById(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc)
      throw new NotFoundException(BLOG_MESSAGES.NOT_FOUND, {
        errorCode: "BLOG_NOT_FOUND",
      });
    return doc;
  }

  create(dto: BlogDto.Create) {
    return this.model.create(dto);
  }

  async update(id: string, dto: BlogDto.Update) {
    const doc = await this.model
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc)
      throw new NotFoundException(BLOG_MESSAGES.NOT_FOUND, {
        errorCode: "BLOG_NOT_FOUND",
      });
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc)
      throw new NotFoundException(BLOG_MESSAGES.NOT_FOUND, {
        errorCode: "BLOG_NOT_FOUND",
      });
    return null;
  }
}
```

`errorCode` format: `<RESOURCE>_<REASON>` in UPPER_SNAKE_CASE. Always escape user input used in `$regex`.

## Step 6. Controller: `src/<resource>/<resource>.controller.ts`

No try/catch. No model access. Return plain data (the interceptor wraps it). Every handler has `@ResponseMessage(...)` and `@ApiEnvelope(...)`.

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { BlogService } from "./blog.service.js";
import { BLOG_MESSAGES } from "./blog.messages.js";
import * as BlogDto from "./blog.validation.js";
import { objectIdSchema } from "../common/validation/object-id.js";
import { ResponseMessage } from "../common/decorators/response-message.decorator.js";
import { ApiEnvelope } from "../common/swagger/api-envelope.decorator.js";
import { Public } from "../auth/decorators/public.decorator.js";

@ApiTags("blogs")
@ApiCookieAuth("access_token")
@Controller("blogs")
export class BlogController {
  constructor(private readonly service: BlogService) {}

  @Public() // remove if listing should require login
  @Get()
  @ResponseMessage(BLOG_MESSAGES.LIST_FETCHED)
  @ApiOperation({ summary: "List blogs (paginated)" })
  @ApiEnvelope(BlogDto.Item, { paginated: true })
  list(@Query({ schema: BlogDto.ListQuery }) query: BlogDto.ListQuery) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(":id")
  @ResponseMessage(BLOG_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get a blog" })
  @ApiEnvelope(BlogDto.Item)
  get(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ResponseMessage(BLOG_MESSAGES.CREATED)
  @ApiOperation({ summary: "Create a blog" })
  @ApiEnvelope(BlogDto.Item, { status: 201 })
  create(@Body({ schema: BlogDto.Create }) dto: BlogDto.Create) {
    return this.service.create(dto);
  }

  @Put(":id")
  @ResponseMessage(BLOG_MESSAGES.UPDATED)
  @ApiOperation({ summary: "Update a blog" })
  @ApiEnvelope(BlogDto.Item)
  update(
    @Param("id", { schema: objectIdSchema }) id: string,
    @Body({ schema: BlogDto.Update }) dto: BlogDto.Update,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ResponseMessage(BLOG_MESSAGES.DELETED)
  @ApiOperation({ summary: "Delete a blog" })
  @ApiEnvelope(null)
  remove(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.remove(id);
  }
}
```

Everything is protected by the global guard (Step 8) unless marked `@Public()`. Public or protected comes from the interview answers.

## Step 7. Module and registration

`src/<resource>/<resource>.module.ts`

```ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Blog, BlogSchema } from "./blog.entity.js";
import { BlogController } from "./blog.controller.js";
import { BlogService } from "./blog.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
```

Add `BlogModule` to `imports` in `src/app.module.ts`.

## Step 8. Auth: JWT in an httpOnly cookie (one-time, skip if `src/auth/` exists)

Create a `users` module (entity: `email` unique and lowercase, `passwordHash` with `select: false`, `role` enum default `user`) and `src/auth/` with: `auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.messages.ts`, `auth.validation.ts`, `jwt-auth.guard.ts`, `decorators/public.decorator.ts`.

`auth.validation.ts` follows the same same-name pattern as Step 4: `Register` (email, password min 8) and `Login`, each exported as schema plus type, imported as `import * as AuthDto`.

`decorators/public.decorator.ts`

```ts
import { Reflector } from "@nestjs/core";
export const Public = Reflector.createDecorator<void, boolean>({
  transform: () => true,
});
```

`jwt-auth.guard.ts` reads the token from the cookie, not the Authorization header:

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Public } from "./decorators/public.decorator.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride(Public, [
        ctx.getHandler(),
        ctx.getClass(),
      ])
    )
      return true;
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.access_token;
    if (!token)
      throw new UnauthorizedException("Not authenticated", {
        errorCode: "AUTH_REQUIRED",
      });
    try {
      req.user = await this.jwt.verifyAsync(token);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token", {
        errorCode: "AUTH_INVALID_TOKEN",
      });
    }
  }
}
```

`auth.module.ts`: import `UsersModule` and `JwtModule.registerAsync` (secret from `JWT_SECRET`, `signOptions: { expiresIn: config.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS') }`), and register the guard globally:

```ts
providers: [AuthService, { provide: APP_GUARD, useClass: JwtAuthGuard }];
```

`auth.controller.ts` (tag `auth`, messages in `auth.messages.ts`, e.g. `LOGGED_IN: 'User logged in successfully'`):

- `POST /api/auth/register` (`@Public`, 201): validate with `AuthDto.Register`, hash the password with bcryptjs (cost 10), create the user, return it without `passwordHash`. Message: `User registered successfully`.
- `POST /api/auth/login` (`@Public`, `@HttpCode(200)`): verify the password, sign `{ sub, email, role }`, set the cookie, return `{ id, email }`. Message: `User logged in successfully`.

```ts
async login(@Body({ schema: AuthDto.Login }) dto: AuthDto.Login, @Res({ passthrough: true }) res: Response) {
  const { token, user } = await this.auth.login(dto);
  res.cookie('access_token', token, ACCESS_COOKIE_OPTIONS);
  return user;
}
```

`import type { Response } from 'express'`. Define `ACCESS_COOKIE_OPTIONS` once: `{ httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'lax', maxAge: JWT_EXPIRES_IN_SECONDS * 1000 }`.

- `POST /api/auth/logout`: `res.clearCookie('access_token', ACCESS_COOKIE_OPTIONS)`, return `null`. Message: `User logged out successfully`.
- `GET /api/auth/me`: return the current user from `req.user`. Message: `Current user fetched successfully`.

Auth rules:

- Wrong email and wrong password both return `Invalid credentials` with `errorCode: 'AUTH_INVALID_CREDENTIALS'`. When the user is not found, still run a bcrypt compare against a dummy hash so response timing does not reveal which emails exist.
- Never return or log `passwordHash`.
- Role-restricted endpoints (`RolesGuard` + `@Roles('admin')`): ask me before adding.

## Step 9. Verify (curl only)

Start the app and test with curl, using a cookie jar for authenticated calls:

```bash
curl -i -c cookies.txt -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"...","password":"..."}'
curl -i -b cookies.txt 'localhost:3000/api/blogs?page=1&limit=5&sortBy=title&order=asc'
```

Check:

- Status codes: 201 create, 200 others, 400 validation, 401 unauthenticated, 404 missing, 409 duplicate.
- Success and error shapes match "Response shapes" exactly, and `message` is resource-specific (never `Success`).
- `meta` appears on list endpoints. `limit=1000` returns 400. An unknown body key returns 400.
- Send a bad body and look at the `errors` array. If it is not a readable list of strings, adjust the normalization in the exception filter.
- `/api/docs` lists the new routes with the `{ success, message, data }` envelope.
  Create test records only if I allow it, and tell me which ones you created.

## Rules to Remember

| Rule                                                                             | Why                                                                         |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Validate only with Zod via `@Body/@Query/@Param({ schema })`                     | `StandardSchemaValidationPipe` is the single validation path                |
| Register `StandardSchemaValidationPipe` globally                                 | The `schema` option alone only attaches metadata                            |
| Import validation files as a namespace; schema and type share one name           | Short imports, and avoids TS1272 with `isolatedModules`                     |
| No DTO classes or abstract classes for request/response types                    | Zod is the single source; classes duplicate it                              |
| Never define a Zod schema inline in a module, controller, or service             | Schemas live in `*.validation.ts` files, so they stay reusable and testable |
| Every handler has `@ResponseMessage(X_MESSAGES.Y)` and `@ApiEnvelope(...)`       | Specific messages and accurate Swagger                                      |
| All message strings live in `<resource>.messages.ts`                             | One source of truth, greppable, i18n-ready                                  |
| A response saying `Success` means a missing decorator                            | `Success` is only the safety fallback                                       |
| Frontends branch on status, `success`, and `errorCode`, never on `message`       | `message` is display text only                                              |
| Services return data, a `Paginated`, or throw. Controllers return plain data     | The interceptor owns the envelope                                           |
| Never use the Mongoose model in controllers                                      | All DB access goes through the service                                      |
| Sort fields are whitelisted enums, search input is regex-escaped                 | Prevents arbitrary-field sort and regex injection                           |
| Throw Nest exceptions with `errorCode`, never raw errors                         | The filter formats them and hides internals                                 |
| Relative imports end in `.js`                                                    | ESM requirement                                                             |
| Secrets only in `.env`; env vars declared only in `src/config/env.validation.ts` | Boot fails fast, and no schema is defined inline in modules                 |
| JWT lives only in an httpOnly cookie                                             | Protects the token from XSS                                                 |
| Ask before any destructive schema or data change                                 | Protects existing data                                                      |
