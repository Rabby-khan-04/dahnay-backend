import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination/pagination.js";

// The public image shape: every image reference in every other resource
// resolves to this object (link = the stored src URL, id = library row when
// the URL is known to the library, null otherwise).
export const ImageObject = z.object({
  id: z.string().nullable(),
  link: z.string(),
});
export type ImageObject = z.infer<typeof ImageObject>;

export const Create = z.strictObject({
  src: z.string().trim().min(1).max(2000),
  fileId: z.string().trim().min(1).max(500).optional(),
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

export const ListQuery = paginationQuerySchema.extend({
  sortBy: z.enum(["id", "src"]).default("id"),
  search: z.string().trim().min(1).optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const Item = z.object({
  id: z.string(),
  src: z.string(),
  fileId: z.string().nullable(),
});
export type Item = z.infer<typeof Item>;
