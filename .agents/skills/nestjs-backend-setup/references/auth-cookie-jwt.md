# Cookie JWT auth (one-time, Step 8)

Skip if `src/auth/` already exists. The `User` model and `Role` enum come from `references/project-setup.md`.

Create:
- a `users` module with `UsersService.findByEmail(email)` (uses `omit: { passwordHash: false }`) and `create(data)`
- `src/auth/`: `auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.messages.ts`, `auth.validation.ts`, `jwt-auth.guard.ts`, `decorators/public.decorator.ts`

Add `AuthModule` to `imports` in `src/app.module.ts`.

`auth.validation.ts` follows the same pattern as a resource: `Register` (email, password min 8) and `Login`, each exported as schema + type, imported as `import * as AuthDto from "./auth.validation.js"`.

`src/auth/decorators/public.decorator.ts`

```ts
import { Reflector } from "@nestjs/core";
export const Public = Reflector.createDecorator<void, boolean>({
  transform: () => true,
});
```

`src/auth/jwt-auth.guard.ts` — reads the token from the cookie, not the Authorization header:

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

`auth.module.ts` — import `UsersModule` and `JwtModule.registerAsync` (secret from `JWT_SECRET`, `signOptions: { expiresIn: config.getOrThrow<number>("JWT_EXPIRES_IN_SECONDS") }`), and register the guard globally:

```ts
providers: [AuthService, { provide: APP_GUARD, useClass: JwtAuthGuard }];
```

`auth.controller.ts` (tag `auth`, messages in `auth.messages.ts`, e.g. `LOGGED_IN: "User logged in successfully"`):

- `POST /api/auth/register` (`@Public`, 201): validate with `AuthDto.Register`, hash with bcryptjs (cost 10), create the user, return it (`passwordHash` is omitted by default). Catch Prisma `P2002` in `AuthService.register` and throw `ConflictException(AUTH_MESSAGES.EMAIL_TAKEN, { errorCode: "AUTH_EMAIL_TAKEN" })`. Message: `User registered successfully`.
- `POST /api/auth/login` (`@Public`, `@HttpCode(200)`): load the user with `passwordHash`, verify, sign `{ sub, email, role }`, set the cookie, return `{ id, email, role }`.
- `POST /api/auth/logout`: `res.clearCookie("access_token", ACCESS_COOKIE_OPTIONS)`, return `null`.
- `GET /api/auth/me`: return the current user from `req.user`.

```ts
async login(
  @Body({ schema: AuthDto.Login }) dto: AuthDto.Login,
  @Res({ passthrough: true }) res: Response,
) {
  const { token, user } = await this.auth.login(dto);
  res.cookie("access_token", token, ACCESS_COOKIE_OPTIONS);
  return user;
}
```

`import type { Response } from "express"`. Define `ACCESS_COOKIE_OPTIONS` once:

```ts
{
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "lax",
  maxAge: JWT_EXPIRES_IN_SECONDS * 1000,
}
```

Auth rules:
- Wrong email and wrong password both return `Invalid credentials` with `errorCode: "AUTH_INVALID_CREDENTIALS"`. When the user is not found, still run a bcrypt compare against a dummy hash so timing does not reveal which emails exist.
- `passwordHash` is omitted globally in `PrismaService`; only the login lookup overrides it. Never return or log it.
- Role-restricted endpoints (`RolesGuard` + `@Roles("admin")`): ask before adding.
