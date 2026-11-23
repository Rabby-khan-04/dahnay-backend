import { z } from "zod";
import { ImageObject } from "../media/media.validation.js";
import { FaqItem, MediaUrl, WhyUsItem } from "../common/validation/content-blocks.validation.js";

export const ContentStatus = z.enum(["DRAFT", "PUBLISHED"]);
export type ContentStatus = z.infer<typeof ContentStatus>;

const Title = z.string().trim().min(1).max(200);
const Text = z.string().trim().min(1);

// Shared page blocks. Image fields hold plain URL strings on write and
// resolve to { id, link } objects on read.
export const PageCounter = z.strictObject({
  count: z.string().trim().min(1).max(100),
  title: Title,
});
export type PageCounter = z.infer<typeof PageCounter>;

export const PageBanner = z.strictObject({
  image: MediaUrl,
  title: Title,
  description: Text,
});
export type PageBanner = z.infer<typeof PageBanner>;

export const PageOffer = z.strictObject({
  title: Title,
  description: Text,
  image: MediaUrl.optional(),
  video: MediaUrl.optional(),
});
export type PageOffer = z.infer<typeof PageOffer>;

export const PageSolutions = z.strictObject({
  title: Title,
  description: Text,
});
export type PageSolutions = z.infer<typeof PageSolutions>;

export const PageAboutUs = z.strictObject({
  title: Title,
  description: Text,
  video: MediaUrl,
  image: MediaUrl,
});
export type PageAboutUs = z.infer<typeof PageAboutUs>;

export const PageWhyUs = z.strictObject({
  title: Title,
  description: Text,
  items: z.array(WhyUsItem),
});
export type PageWhyUs = z.infer<typeof PageWhyUs>;

export const PageInfo = z.strictObject({
  title: Title,
  images: z.array(MediaUrl),
  bannerImg: MediaUrl,
});
export type PageInfo = z.infer<typeof PageInfo>;

export const PageCta = z.strictObject({
  title: Title,
  bannerImg: MediaUrl,
});
export type PageCta = z.infer<typeof PageCta>;

export const PageFaq = z.strictObject({
  title: Title,
  description: Text,
  faqs: z.array(FaqItem),
});
export type PageFaq = z.infer<typeof PageFaq>;

// Optional companion: registers each { src, fileId } pair in the media
// library on write (lets the admin panel upload to ImageKit first).
const MediaFile = z.strictObject({
  src: MediaUrl,
  fileId: z.string().trim().min(1).max(500),
});
type MediaFile = z.infer<typeof MediaFile>;

// Accept what GET returns: image objects unwrap to their URL, nulls drop.
// Lets an admin UI GET a page, edit text, and POST it back verbatim.
const refOf = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (v !== null && typeof v === "object") {
    const obj = v as { link?: unknown };
    if (typeof obj.link === "string" && obj.link.trim().length > 0) return obj.link;
  }
  return undefined;
};

const IMAGE_KEYS = [
  "image",
  "img",
  "icon",
  "video",
  "bannerImg",
  "poster",
  "ogImage",
];

const normalizeInput = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(normalizeInput);
  if (v !== null && typeof v === "object") {
    const keys = Object.keys(v);
    // Bare image objects inside arrays (e.g. info.images[]) unwrap to URL.
    if (
      typeof (v as Record<string, unknown>).link === "string" &&
      keys.every((k) => k === "id" || k === "link")
    )
      return (v as Record<string, unknown>).link;
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === null || val === undefined) continue;
      if (IMAGE_KEYS.includes(k)) {
        const ref = refOf(val);
        if (ref !== undefined) out[k] = ref;
        continue;
      }
      out[k] = normalizeInput(val);
    }
    return out;
  }
  return v;
};

const normalizeFiles = (v: unknown) =>
  Array.isArray(v)
    ? v.map((f) =>
        f && typeof f === "object"
          ? {
              src: typeof (f as any).src === "string" ? (f as any).src : (f as any).link,
              fileId: (f as any).fileId,
            }
          : f,
      )
    : v;

const normalizePageInput = (v: unknown) =>
  v !== null && typeof v === "object"
    ? {
        ...(normalizeInput(v) as Record<string, unknown>),
        files: normalizeFiles((v as Record<string, unknown>).files),
      }
    : v;

// Home page: fixed shape per the .tmp Home type (titles without accents).
export const HomeBody = z.strictObject({
  banner: z.array(PageBanner).optional(),
  offer: PageOffer.optional(),
  solutions: PageSolutions,
  aboutUs: PageAboutUs,
  whyUs: PageWhyUs,
  info: PageInfo,
  cta: PageCta,
  faq: PageFaq,
  files: z.array(MediaFile).optional(),
  status: ContentStatus.optional(),
});
export type HomeBody = z.infer<typeof HomeBody>;

export const HomeCreate = z.preprocess(normalizePageInput, HomeBody);
export type HomeCreate = z.infer<typeof HomeCreate>;

// Contact page: banner + counters only, per the .tmp Contact type.
export const ContactBody = z.strictObject({
  bannerImg: MediaUrl.optional(),
  bannerImgFileId: z.string().trim().min(1).max(500).optional(),
  counter: z.array(PageCounter).optional(),
  files: z.array(MediaFile).optional(),
  status: ContentStatus.optional(),
});
export type ContactBody = z.infer<typeof ContactBody>;

export const ContactCreate = z.preprocess(normalizePageInput, ContactBody);
export type ContactCreate = z.infer<typeof ContactCreate>;

const BannerOut = z.strictObject({
  image: ImageObject.nullable(),
  title: z.string(),
  description: z.string(),
});

const WhyUsItemOut = z.strictObject({
  icon: ImageObject.nullable(),
  title: z.string(),
  description: z.string(),
});

export const HomeItem = z.object({
  id: z.string(),
  slug: z.string(),
  banner: z.array(BannerOut).optional(),
  offer: z
    .strictObject({
      title: z.string(),
      description: z.string(),
      image: ImageObject.nullable().optional(),
      video: ImageObject.nullable().optional(),
    })
    .nullable()
    .optional(),
  solutions: z.strictObject({ title: z.string(), description: z.string() }),
  aboutUs: z.strictObject({
    title: z.string(),
    description: z.string(),
    video: ImageObject.nullable(),
    image: ImageObject.nullable(),
  }),
  whyUs: z.strictObject({
    title: z.string(),
    description: z.string(),
    items: z.array(WhyUsItemOut),
  }),
  info: z.strictObject({
    title: z.string(),
    images: z.array(ImageObject.nullable()),
    bannerImg: ImageObject.nullable(),
  }),
  cta: z.strictObject({ title: z.string(), bannerImg: ImageObject.nullable() }),
  faq: z.strictObject({
    title: z.string(),
    description: z.string(),
    faqs: z.array(FaqItem),
  }),
  status: ContentStatus,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type HomeItem = z.infer<typeof HomeItem>;

export const ContactItem = z.object({
  id: z.string(),
  slug: z.string(),
  bannerImg: ImageObject.nullable().optional(),
  counter: z.array(PageCounter).optional(),
  status: ContentStatus,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type ContactItem = z.infer<typeof ContactItem>;
