import { z } from "zod";
import { ImageObject } from "../media/media.validation.js";
import { paginationQuerySchema } from "../common/pagination/pagination.js";

export const ArticleType = z.enum(["BLOG", "CASE_STUDY", "NEWS"]);
export type ArticleType = z.infer<typeof ArticleType>;

export const ContentStatus = z.enum(["DRAFT", "PUBLISHED"]);
export type ContentStatus = z.infer<typeof ContentStatus>;

export const Create = z.strictObject({
  type: ArticleType,
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().min(1).max(2000),
  // Plain ImageKit/S3 URL string (no relation). The companion fileId registers
  // the URL in the media library; without it the URL must already be known.
  blogImg: z.string().trim().min(1).max(2000),
  blogImgFileId: z.string().trim().min(1).max(500).optional(),
  content: z.string().trim().min(1),
  status: ContentStatus.optional(),
  // offset:true — real CMS dates carry numeric zones (e.g. +05:30), not just Z
  publishedAt: z.iso.datetime({ offset: true }),
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

export const ListQuery = paginationQuerySchema.extend({
  sortBy: z.enum(["publishedAt", "createdAt", "title"]).default("publishedAt"),
  search: z.string().trim().min(1).optional(),
  type: ArticleType.optional(),
  status: ContentStatus.optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const Item = z.object({
  id: z.string(),
  type: ArticleType,
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  blogImg: ImageObject.nullable(),
  content: z.string(),
  status: ContentStatus,
  publishedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Item = z.infer<typeof Item>;
