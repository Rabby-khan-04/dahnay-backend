import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination/pagination.js";

export const ContactKind = z.enum(["PHONE", "EMAIL"]);
export type ContactKind = z.infer<typeof ContactKind>;

export const ContentStatus = z.enum(["DRAFT", "PUBLISHED"]);
export type ContentStatus = z.infer<typeof ContentStatus>;

export const OfficeContact = z.strictObject({
  type: ContactKind,
  value: z.string().trim().min(1).max(500),
  href: z.string().trim().min(1).max(500).optional(),
});
export type OfficeContact = z.infer<typeof OfficeContact>;

export const Create = z.strictObject({
  city: z.string().trim().min(1).max(200),
  country: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(1000),
  contacts: z.array(OfficeContact).min(1),
  status: ContentStatus.optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

export const ListQuery = paginationQuerySchema.extend({
  sortBy: z.enum(["country", "sortOrder", "createdAt", "city"]).default("sortOrder"),
  search: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  status: ContentStatus.optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const Item = z.object({
  id: z.string(),
  city: z.string(),
  country: z.string(),
  address: z.string(),
  contacts: z.array(
    z.object({
      type: z.string(),
      value: z.string(),
      href: z.string().nullable().optional(),
    }),
  ),
  status: ContentStatus,
  sortOrder: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Item = z.infer<typeof Item>;
