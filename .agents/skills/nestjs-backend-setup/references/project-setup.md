# One-time project setup

Apply only the parts that do not exist yet. Check `package.json`, `src/app.module.ts`, and whether `prisma/`, `src/prisma/`, `src/common/`, `src/config/`, `src/auth/` are present.

## 0.1 Dependencies

```bash
bun add @nestjs/config @nestjs/swagger @nestjs/jwt @prisma/client@6 zod cookie-parser bcryptjs
bun add -d prisma@6 @types/cookie-parser
```

Use the project's package manager if it is not bun. Read peer-dependency warnings: every `@nestjs/*` package must support Nest 12. Add `"postinstall": "prisma generate"` to `package.json` scripts.

## 0.2 MongoDB URI and `.env`

- Ask for the connection string. It must include the database name: `mongodb+srv://<user>:<password>@<cluster>/<dbname>?retryWrites=true&w=majority`. Ask for the database name if missing.
- Prisma needs a replica set. Atlas provides one; a local MongoDB must be started as a replica set.
- Write `.env`: `DATABASE_URL`, `JWT_SECRET` (48+ random chars), `JWT_EXPIRES_IN_SECONDS=604800`, `PORT=3000`, `NODE_ENV=development`.
- Ensure `.env` and `src/generated/` are in `.gitignore`. Create `.env.example` with the same keys and empty values.
- Never echo the URI or secret back in chat.

## 0.3 Prisma schema and client

Write `prisma/schema.prisma` by hand (do **not** run `prisma init`; it can clobber `.env`):

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

Then:

```bash
bunx prisma format
bunx prisma validate
bunx prisma db push
```

`db push` creates collections/indexes and generates the client. This is the first push, so apply the Hard Rules: stop on any warning.

`src/prisma/prisma.service.ts`

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "../generated/prisma/client.js";
import type { Env } from "../config/env.validation.js";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService<Env, true>) {
    super({
      datasourceUrl: config.getOrThrow("DATABASE_URL"),
      omit: { user: { passwordHash: true } }, // only login overrides this
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

`src/prisma/prisma.module.ts`

```ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

`src/prisma/or-not-found.ts`

```ts
import { NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";

export async function orNotFound<T>(
  operation: Promise<T>,
  message: string,
  errorCode: string,
): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundException(message, { errorCode });
    }
    throw error;
  }
}
```

## 0.4 Common building blocks

`src/common/decorators/response-message.decorator.ts`

```ts
import { Reflector } from "@nestjs/core";
export const ResponseMessage = Reflector.createDecorator<string>();
```

`src/common/decorators/skip-response-wrapper.decorator.ts`

```ts
import { Reflector } from "@nestjs/core";
export const SkipResponseWrapper = Reflector.createDecorator<void, boolean>({
  transform: () => true,
});
```

`src/common/validation/object-id.ts`

```ts
import { z } from "zod";
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
```

`src/common/pagination/pagination.ts`

```ts
import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
type PageInput = Pick<PaginationQuery, "page" | "limit">;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class Paginated<T> {
  constructor(
    public readonly items: T[],
    public readonly meta: PaginationMeta,
  ) {}
}

export const pageArgs = ({ page, limit }: PageInput) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export function toPaginated<T>(
  items: T[],
  total: number,
  { page, limit }: PageInput,
): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return new Paginated(items, {
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
      this.reflector.getAllAndOverride(ResponseMessage, targets) ?? "Success";
    return next.handle().pipe(
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
import { Prisma } from "../../generated/prisma/client.js";

const PRISMA_ERRORS: Record<string, [HttpStatus, string]> = {
  P2002: [HttpStatus.CONFLICT, "Resource already exists"],
  P2025: [HttpStatus.NOT_FOUND, "Record not found"],
  P2003: [HttpStatus.BAD_REQUEST, "Invalid reference"],
  P2014: [HttpStatus.BAD_REQUEST, "Invalid reference"],
  P2023: [HttpStatus.BAD_REQUEST, "Invalid id"],
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (res.headersSent) return;

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
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      PRISMA_ERRORS[exception.code]
    ) {
      const [mappedStatus, mappedMessage] = PRISMA_ERRORS[exception.code]!;
      status = mappedStatus;
      errors = [mappedMessage];
    } else {
      this.logger.error(exception);
    }

    const message =
      errors.length === 1 && typeof errors[0] === "string"
        ? errors[0]
        : "Validation failed";
    res.status(status).json({
      success: false,
      message,
      errors,
      ...(errorCode && { errorCode }),
    });
  }
}
```

`src/common/swagger/api-envelope.decorator.ts`

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

## 0.5 Env validation and `AppModule`

`src/config/env.validation.ts`

```ts
import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .startsWith("mongodb", "DATABASE_URL must be a MongoDB connection string"),
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
import { ConfigModule } from "@nestjs/config";
import { envSchema } from "./config/env.validation.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    PrismaModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }],
})
export class AppModule {}
```

## 0.6 `src/main.ts`

```ts
import { NestFactory } from "@nestjs/core";
import { StandardSchemaValidationPipe } from "@nestjs/common"; // verify import against Nest 12 docs
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
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle("API")
    .setDescription("API documentation")
    .setVersion("1.0")
    .addCookieAuth("access_token")
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

Swagger UI is at `/api/docs`. If schemas are missing there, add a `standardSchemaConverter` to `createDocument` (see the Nest OpenAPI "Standard Schema" docs).
