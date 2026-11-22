import { z } from "zod";
import { objectIdSchema } from "../common/validation/object-id.js";
import { paginationQuerySchema } from "../common/pagination/pagination.js";

export const MediaKind = z.enum(["IMAGE", "VIDEO"]);
export type MediaKind = z.infer<typeof MediaKind>;

// The public image shape: every image reference in every other resource
// resolves to this object (link = underlying src URL).
export const ImageObject = z.object({
  id: z.string(),
  link: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  title: z.string().nullable(),
  alt: z.string().nullable(),
});
export type ImageObject = z.infer<typeof ImageObject>;

export const Create = z.strictObject({
  kind: MediaKind,
  src: z.string().trim().min(1).max(2000),
  alt: z.string().trim().max(500).optional(),
  width: z.number().int().min(1).max(10000).optional(),
  height: z.number().int().min(1).max(10000).optional(),
  mime: z.string().trim().max(100).optional(),
  title: z.string().trim().max(200).optional(),
  posterId: objectIdSchema.nullable().optional(),
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

export const ListQuery = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt", "title", "src"]).default("createdAt"),
  search: z.string().trim().min(1).optional(),
  kind: MediaKind.optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const Item = z.object({
  id: z.string(),
  kind: MediaKind,
  src: z.string(),
  alt: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  mime: z.string().nullable(),
  title: z.string().nullable(),
  poster: ImageObject.nullable(),
  createdAt: z.iso.datetime(),
});
export type Item = z.infer<typeof Item>;
