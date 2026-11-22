import { z } from "zod";
import { objectIdSchema } from "../common/validation/object-id.js";
import { ImageObject } from "../media/media.validation.js";
import * as Blocks from "../common/validation/content-blocks.validation.js";
import { paginationQuerySchema } from "../common/pagination/pagination.js";

export const ContentStatus = z.enum(["DRAFT", "PUBLISHED"]);
export type ContentStatus = z.infer<typeof ContentStatus>;

export const Create = z.strictObject({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string().trim().min(1).max(200),
  // Plain ImageKit/S3 URL string (no relation). The companion fileId registers
  // the URL in the media library; without it the URL must already be known.
  bannerImg: Blocks.MediaUrl,
  bannerImgFileId: z.string().trim().min(1).max(500).optional(),
  overview: Blocks.IndustryOverview,
  experties: Blocks.IndustryExpertise,
  whyUs: Blocks.WhyUsBlock,
  faq: Blocks.IndustryFaq,
  caseStudyId: objectIdSchema.nullable().optional(),
  status: ContentStatus.optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

export const ListQuery = paginationQuerySchema.extend({
  sortBy: z.enum(["sortOrder", "createdAt", "updatedAt", "name"]).default("sortOrder"),
  search: z.string().trim().min(1).optional(),
  status: ContentStatus.optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const Item = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  bannerImg: ImageObject.nullable(),
  overview: Blocks.IndustryOverviewOut,
  experties: Blocks.ExpertiseBlockOut,
  whyUs: Blocks.WhyUsBlockOut,
  faq: Blocks.IndustryFaqOut,
  caseStudyId: z.string().nullable().optional(),
  status: ContentStatus,
  sortOrder: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Item = z.infer<typeof Item>;
