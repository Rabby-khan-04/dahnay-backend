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
