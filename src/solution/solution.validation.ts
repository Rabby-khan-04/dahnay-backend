import { z } from "zod";
import { objectIdSchema } from "../common/validation/object-id.js";
import { paginationQuerySchema } from "../common/pagination/pagination.js";
import { ImageObject } from "../media/media.validation.js";

export const SolutionKind = z.enum(["LOGISTICS", "LINES", "PORTS_INFRA"]);
export type SolutionKind = z.infer<typeof SolutionKind>;

export const ContentStatus = z.enum(["DRAFT", "PUBLISHED"]);
export type ContentStatus = z.infer<typeof ContentStatus>;

export const BlockType = z.enum([
  "HERO",
  "INTRO",
  "SERVICES",
  "INDUSTRIES",
  "ICON_CARDS",
  "GPTW",
  "NEWSROOM",
  "CTA",
  "FAQ",
  "CONTACT_FORM",
  "BANNER",
  "SOLUTION_GRID",
  "FEATURE_LIST",
  "PROFILE",
  "CONTENT_BLOCK",
  "CAREER_FORM",
  "ARTICLE_LIST",
  "NEWSLETTER_CTA",
  "CONTACT_STATS",
  "OFFICE_LIST",
  "BREADCRUMB",
  "ARTICLE_BODY",
]);
export type BlockType = z.infer<typeof BlockType>;

export const Section = z.strictObject({
  id: z.string().trim().min(1),
  type: BlockType,
  visible: z.boolean(),
  sortOrder: z.number().int().min(0),
  content: z.record(z.string(), z.unknown()),
});
export type Section = z.infer<typeof Section>;

export const SolutionDetail = z.strictObject({
  intro: z.string().trim().min(1),
  sections: z.array(Section).default([]),
});
export type SolutionDetail = z.infer<typeof SolutionDetail>;

export const Create = z.strictObject({
  kind: SolutionKind,
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().trim().min(1).max(200),
  shortDescription: z.string().trim().min(1).max(2000),
  imageId: objectIdSchema,
  detail: SolutionDetail,
  status: ContentStatus.optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

export const ListQuery = paginationQuerySchema.extend({
  sortBy: z
    .enum(["sortOrder", "createdAt", "updatedAt", "title"])
    .default("sortOrder"),
  search: z.string().trim().min(1).optional(),
  kind: SolutionKind.optional(),
  status: ContentStatus.optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const Item = z.object({
  id: z.string(),
  kind: SolutionKind,
  slug: z.string(),
  title: z.string(),
  shortDescription: z.string(),
  image: ImageObject.nullable(),
  detail: z.object({
    intro: z.string(),
    sections: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        visible: z.boolean(),
        sortOrder: z.number(),
        content: z.record(z.string(), z.unknown()),
      }),
    ),
  }),
  status: ContentStatus,
  sortOrder: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Item = z.infer<typeof Item>;
