import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
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
      },
    }),
  );
};
