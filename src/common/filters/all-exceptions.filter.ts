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
  P2002: [HttpStatus.CONFLICT, "Resource already exists"], // unique constraint
  P2025: [HttpStatus.NOT_FOUND, "Record not found"],
  P2003: [HttpStatus.BAD_REQUEST, "Invalid reference"],
  P2014: [HttpStatus.BAD_REQUEST, "Invalid reference"],
  P2023: [HttpStatus.BAD_REQUEST, "Invalid id"], // malformed ObjectId
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
      this.logger.error(exception); // log unexpected errors server-side only
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
