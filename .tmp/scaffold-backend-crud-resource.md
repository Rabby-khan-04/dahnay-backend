# Adding a New CRUD Resource — Backend Guide

## Step-by-Step

### 1. Prisma Model

- first interview me about the data columns/properties.
- then write the prisma model carefully.
- run migration with appropriate name.
- don't proceed if any destructive things going to happen when migration, STOP and ask me.

Add the model to `prisma/schema.prisma`, run migration:

```bash
bunx prisma migrate dev --name add_my_resource
bunx prisma generate
```

### 2. Zod Schema

Add schema + input type to `src/validations/index.ts`:

```ts
export const MyResourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});
export type MyResourceInput = z.infer<typeof MyResourceSchema>;
```

### 3. Service

Create `src/services/my-resource.ts` — Prisma queries only:

```ts
import { prisma } from "../lib/prisma.js";
import type { MyResourceInput } from "../validations/index.js";

export const myResourceService = {
  findAll: () => prisma.myResource.findMany({ orderBy: { createdAt: "desc" } }),
  findById: (id: string) => prisma.myResource.findUnique({ where: { id } }),
  create: (data: MyResourceInput) => prisma.myResource.create({ data }),
  update: (id: string, data: Partial<MyResourceInput>) =>
    prisma.myResource.update({ where: { id }, data }),
  delete: (id: string) => prisma.myResource.delete({ where: { id } }),
};
```

### 4. Controller

Create `src/controllers/my-resource.ts` — no try/catch needed (Express 5 auto-forwards async errors):

```ts
import type { RequestHandler } from "express";
import { myResourceService } from "../services/my-resource.js";
import { sendSuccess } from "../lib/response.js";

export const list: RequestHandler = async (_req, res) => {
  const data = await myResourceService.findAll();
  sendSuccess(res, 200, data);
};

export const create: RequestHandler = async (req, res) => {
  const data = await myResourceService.create(req.body);
  sendSuccess(res, 201, data);
};

export const update: RequestHandler = async (req, res) => {
  const data = await myResourceService.update(String(req.params.id), req.body);
  sendSuccess(res, 200, data);
};

export const remove: RequestHandler = async (req, res) => {
  await myResourceService.delete(String(req.params.id));
  sendSuccess(res, 200, null);
};
```

### 5. Routes

**Public route** — `src/routes/my-resource.routes.ts`:

```ts
import { Router } from "express";
import { list } from "../controllers/my-resource.js";
export const myResourceRouter = Router();
myResourceRouter.get("/", list);
```

**Admin route** — `src/routes/admin/my-resource.routes.ts`:

```ts
import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { MyResourceSchema } from "../../validations/index.js";
import { list, create, update, remove } from "../../controllers/my-resource.js";
export const adminMyResourceRouter = Router();
adminMyResourceRouter.get("/", list);
adminMyResourceRouter.post("/", validate(MyResourceSchema), create);
adminMyResourceRouter.put("/:id", validate(MyResourceSchema), update);
adminMyResourceRouter.delete("/:id", remove);
```

### 6. Mount in `src/index.ts`

```ts
import { myResourceRouter } from "./routes/my-resource.routes.js";
import { adminMyResourceRouter } from "./routes/admin/my-resource.routes.js";

app.use("/api/my-resource", myResourceRouter);
app.use(
  "/api/admin/my-resource",
  requireResourceAccess("my-resource"),
  adminMyResourceRouter,
);
```

## Rules to Remember

| Rule                                                               | Why                                                                   |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **No try/catch** in async handlers                                 | Express 5 auto-catches rejected promises                              |
| **Use `sendSuccess(res, status, data)`**                           | Consistent `{ success: true, data }` shape                            |
| **Use `sendError(res, status, [...])`** for inline error responses | Consistent `{ success: false, errors }` shape                         |
| **Throw errors with `statusCode`** for not-found/bad-request       | errorHandler reads `err.statusCode` and formats the response          |
| **Validation goes in routes, not controllers**                     | `validate(schema)` middleware before the controller                   |
| **Never call Prisma in controllers**                               | All DB access goes through the service layer                          |
| **Never send raw error messages to the client**                    | The global errorHandler handles Zod, Prisma, and generic errors       |
| **Zod errors are auto-formatted**                                  | errorHandler detects `ZodError` and calls `err.flatten()` → 400       |
| **Prisma errors are auto-mapped**                                  | P2002→409, P2025→404, P2003→400, P2014→400 with readable messages     |
| **`res.headersSent` guard in errorHandler**                        | Delegates to default Express handler if response already started      |
| **auth.ts and upload.ts may need try/catch**                       | Only if the handler sends inline error responses (not via throw/next) |

## Hard Rules

- don't run seed or update any data on the database unless I explicitely ask for.
- don't run raw sql query, all data operation must be gone through curl with existing endpoints.
