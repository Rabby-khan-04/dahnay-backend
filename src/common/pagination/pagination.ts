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

// The interceptor detects this class with instanceof, so no duck-typing false positives.
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