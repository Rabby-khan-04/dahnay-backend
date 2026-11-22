# Scaffold one CRUD resource (Steps 2–7)

Assumes the one-time foundation from `nestjs-backend-setup` exists: `PrismaService`/`PrismaModule`, the response interceptor, the exception filter, pagination helpers, Swagger decorator, `StandardSchemaValidationPipe`, and the global JWT guard with `@Public()`. Do not recreate those here.

## Placeholders — replace every one before writing code

| Placeholder           | Meaning                                                     | Example                  |
| --------------------- | ----------------------------------------------------------- | ------------------------ |
| `<Resource>`          | PascalCase singular model/class                             | `Blog`                   |
| `<resource>`          | camelCase singular (file names, variables, Prisma delegate) | `blog`                   |
| `<RESOURCE>`          | UPPER_SNAKE (message constants, error code)                 | `BLOG`                   |
| `<resources>`         | plural lower-case route                                     | `blogs`                  |
| `<field>` / `<Field>` | a field from the interview                                  | `title` / `Title`        |
| `<searchField>`       | the field list-search filters on                            | `title`                  |
| `<sortFields>`        | the whitelisted sort fields                                 | `["createdAt", "title"]` |

The Prisma delegate is the camelCase form of the model: `model Blog` → `prisma.blog`. Match it exactly.

## Step 2. Messages — `src/<resource>/<resource>.messages.ts`

```ts
export const <RESOURCE>_MESSAGES = {
  LIST_FETCHED: "<Resource>s fetched successfully",
  FETCHED: "<Resource> fetched successfully",
  CREATED: "<Resource> created successfully",
  UPDATED: "<Resource> updated successfully",
  DELETED: "<Resource> deleted successfully",
  NOT_FOUND: "<Resource> not found",
} as const;
```

Wording: `<Resource> <past-tense action> successfully`; plural for the list.

## Step 3. Check the Prisma schema first

Do not assume a model exists and do not paste a template. Every resource's model is different.

1. Read `prisma/schema.prisma`.
2. Look for a model that belongs to this resource — match by model name, `@@map` collection, or the fields the interview mentioned. Also check the generated client (`prisma.<resource>` delegate) if present.
3. **If a matching model already exists:** use it as-is. Read its fields, types, relations, enums, and indexes, and make the validation/service match that model. Do not change it unless the interview says fields are missing. Any change to an existing model follows the Hard Rules (destructive changes mean STOP and ask).
4. **If no related model exists:** STOP. Tell me the model is missing and run a model interview before writing anything:
   - model name and collection name
   - every field: name, type, required/optional, default, unique, min/max or enum values
   - relations (target model, one-to-one / one-to-many, required or optional)
   - which fields are used for sorting and search (indexes)

   Summarize the answers back and wait for confirmation. Then add the model **from my answers**, not from a template.

5. After adding or confirming the model: `bunx prisma format`, `bunx prisma validate`, `bunx prisma db push`. If `db push` warns or asks, STOP and ask. MongoDB has no migration files; `db push` syncs collections/indexes and regenerates the client.

Conventions to confirm while interviewing (not a fixed shape):

- models use an ObjectId `id` mapped to `_id`
- `createdAt` / `updatedAt` timestamps
- collection name via `@@map`
- `@@index` on sort/search fields
- relations via `@db.ObjectId` + `@relation`; fixed sets via `enum`; uniqueness via `@unique`

## Step 4. Validation — `src/<resource>/<resource>.validation.ts`

```ts
import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination/pagination.js";

export const Create = z.strictObject({
  // <required fields from the interview, with their rules>
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

export const ListQuery = paginationQuerySchema.extend({
  sortBy: z.enum(<sortFields>).default("<defaultSortField>"),
  search: z.string().trim().min(1).optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const Item = z.object({
  ...Create.shape, // add optional/derived fields (id, timestamps, relations) as needed
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Item = z.infer<typeof Item>;
```

Adjust `Item` if the response includes optional fields, relations, or omits create-only fields.

## Step 5. Service — `src/<resource>/<resource>.service.ts`

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { pageArgs, toPaginated } from "../common/pagination/pagination.js";
import type { Prisma } from "../generated/prisma/client.js";
import { <RESOURCE>_MESSAGES } from "./<resource>.messages.js";
import * as <Resource>Dto from "./<resource>.validation.js";

const NOT_FOUND = [<RESOURCE>_MESSAGES.NOT_FOUND, "<RESOURCE>_NOT_FOUND"] as const;

@Injectable()
export class <Resource>Service {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: <Resource>Dto.ListQuery) {
    const { search, sortBy, order, ...paging } = query;
    const where: Prisma.<Resource>WhereInput = search
      ? { <searchField>: { contains: search, mode: "insensitive" } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.<resource>.findMany({
        where,
        orderBy: [
          { [sortBy]: order } as Prisma.<Resource>OrderByWithRelationInput,
          { id: order },
        ],
        ...pageArgs(paging),
      }),
      this.prisma.<resource>.count({ where }),
    ]);
    return toPaginated(items, total, paging);
  }

  findById(id: string) {
    return orNotFound(
      this.prisma.<resource>.findUniqueOrThrow({ where: { id } }),
      ...NOT_FOUND,
    );
  }

  create(dto: <Resource>Dto.Create) {
    return this.prisma.<resource>.create({ data: dto });
  }

  update(id: string, dto: <Resource>Dto.Update) {
    return orNotFound(
      this.prisma.<resource>.update({ where: { id }, data: dto }),
      ...NOT_FOUND,
    );
  }

  async remove(id: string) {
    await orNotFound(
      this.prisma.<resource>.delete({ where: { id } }),
      ...NOT_FOUND,
    );
    return null;
  }
}
```

`errorCode` format: `<RESOURCE>_<REASON>` in UPPER_SNAKE_CASE. Search uses Prisma `contains` + `mode: 'insensitive'`. Never build raw queries. If a create/update field is a relation, pass `{ connect: { id } }` instead of the raw id.

## Step 6. Controller — `src/<resource>/<resource>.controller.ts`

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
import { <Resource>Service } from "./<resource>.service.js";
import { <RESOURCE>_MESSAGES } from "./<resource>.messages.js";
import * as <Resource>Dto from "./<resource>.validation.js";
import { objectIdSchema } from "../common/validation/object-id.js";
import { ResponseMessage } from "../common/decorators/response-message.decorator.js";
import { ApiEnvelope } from "../common/swagger/api-envelope.decorator.js";
import { Public } from "../auth/decorators/public.decorator.js";

@ApiTags("<resources>")
@ApiCookieAuth("access_token")
@Controller("<resources>")
export class <Resource>Controller {
  constructor(private readonly service: <Resource>Service) {}


  @Public()
  @Get(":id")
  @ResponseMessage(<RESOURCE>_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get a <resource>" })
  @ApiEnvelope(<Resource>Dto.Item)
  get(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.findById(id);
  }

  // other controllers...
}
```

No try/catch, no PrismaService. Everything is protected by the global guard from setup unless marked `@Public()`. Add `@Public()` only where the interview said the endpoint is public.

## Step 7. Module and registration

`src/<resource>/<resource>.module.ts`

```ts
import { Module } from "@nestjs/common";
import { <Resource>Controller } from "./<resource>.controller.js";
import { <Resource>Service } from "./<resource>.service.js";

@Module({
  controllers: [<Resource>Controller],
  providers: [<Resource>Service],
})
export class <Resource>Module {}
```

Add `<Resource>Module` to `imports` in `src/app.module.ts`. `PrismaModule` is global, so nothing to import here.
