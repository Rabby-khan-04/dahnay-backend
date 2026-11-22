import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Public } from "./decorators/public.decorator.js";
import { ROLES_KEY } from "./decorators/roles.decorator.js";
import { AUTH_MESSAGES } from "./auth.messages.js";

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
      throw new UnauthorizedException(AUTH_MESSAGES.NOT_AUTHENTICATED, {
        errorCode: "AUTH_REQUIRED",
      });

    try {
      req.user = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN, {
        errorCode: "AUTH_INVALID_TOKEN",
      });
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (requiredRoles?.length && !requiredRoles.includes(req.user.role)) {
      throw new ForbiddenException(AUTH_MESSAGES.FORBIDDEN, {
        errorCode: "AUTH_FORBIDDEN",
      });
    }
    return true;
  }
}
