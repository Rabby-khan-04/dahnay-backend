import { z } from "zod";
import { ImageObject } from "../media/media.validation.js";
import * as Blocks from "../common/validation/content-blocks.validation.js";
import { paginationQuerySchema } from "../common/pagination/pagination.js";

export const SolutionKind = z.enum(["LOGISTICS", "LINES", "PORTS_INFRA"]);
export type SolutionKind = z.infer<typeof SolutionKind>;

export const ContentStatus = z.enum(["DRAFT", "PUBLISHED"]);
export type ContentStatus = z.infer<typeof ContentStatus>;

export const Create = z.strictObject({
  kind: SolutionKind,
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
  overview: Blocks.SolutionOverview.optional(),
  service: Blocks.SolutionServiceBlock.optional(),
  experties: Blocks.ExpertiseBlock.optional(),
  whyUs: Blocks.WhyUsBlock.optional(),
  certifications: Blocks.SolutionCertifications.optional(),
  faq: Blocks.SolutionFaq.optional(),
  status: ContentStatus.optional(),
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

export const ListQuery = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt", "kind", "status", "name"]).default("createdAt"),
  search: z.string().trim().min(1).optional(),
  kind: SolutionKind.optional(),
  status: ContentStatus.optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const Item = z.object({
  id: z.string(),
  kind: SolutionKind,
  slug: z.string(),
  name: z.string(),
  bannerImg: ImageObject.nullable(),
  overview: Blocks.SolutionOverviewOut.nullable().optional(),
  service: Blocks.SolutionServiceBlockOut.nullable().optional(),
  experties: Blocks.ExpertiseBlockOut.nullable().optional(),
  whyUs: Blocks.WhyUsBlockOut.nullable().optional(),
  certifications: Blocks.SolutionCertificationsOut.nullable().optional(),
  faq: Blocks.SolutionFaqOut.nullable().optional(),
  status: ContentStatus,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Item = z.infer<typeof Item>;
