import { z } from "zod";
import { ImageObject } from "../media/media.validation.js";

export const AboutPageType = z.enum(["ABOUT", "ESG_CSR", "CAREERS"]);
export type AboutPageType = z.infer<typeof AboutPageType>;

export const ContentStatus = z.enum(["DRAFT", "PUBLISHED"]);
export type ContentStatus = z.infer<typeof ContentStatus>;

// Round-trip tolerance: GET returns image objects and explicit nulls for
// absent blocks; writes want plain URL strings and absent keys. Normalize
// objects to their link (fall back to id) and drop nulls, so an admin UI can
// GET a page, edit text, and POST it back verbatim.
const refOf = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (v !== null && typeof v === "object") {
    const obj = v as { link?: unknown; id?: unknown };
    if (typeof obj.link === "string" && obj.link.trim().length > 0)
      return obj.link;
    if (typeof obj.id === "string" && obj.id.trim().length > 0)
      return obj.id;
  }
  return undefined;
};

const IMAGE_KEYS = [
  "image",
  "img",
  "icon",
  "bannerImg",
  "media",
  "backgroundImage",
  "ogImage",
];

const normalizeAboutInput = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(normalizeAboutInput);
  if (v !== null && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === null || val === undefined) continue;
      if (IMAGE_KEYS.includes(k)) {
        const ref = refOf(val);
        if (ref !== undefined) out[k] = ref;
        continue;
      }
      out[k] = normalizeAboutInput(val);
    }
    return out;
  }
  return v;
};

const MediaUrl = z.string().trim().min(1).max(2000);
const Title = z.string().trim().min(1).max(200);
const Text = z.string().trim().min(1);

export const AboutCounter = z.strictObject({
  number: z.string().trim().min(1).max(50),
  title: Title,
});
export type AboutCounter = z.infer<typeof AboutCounter>;

export const AboutWhoWeAre = z.strictObject({
  description: Text,
  img: MediaUrl,
  counter: z.array(AboutCounter),
});
export type AboutWhoWeAre = z.infer<typeof AboutWhoWeAre>;

export const AboutWhyUsItem = z.strictObject({
  icon: MediaUrl,
  title: Title,
  description: Text,
});
export type AboutWhyUsItem = z.infer<typeof AboutWhyUsItem>;

export const AboutWhyUs = z.strictObject({
  title: Title,
  description: Text,
  items: z.array(AboutWhyUsItem),
});
export type AboutWhyUs = z.infer<typeof AboutWhyUs>;

export const AboutSocial = z.strictObject({
  type: z.string().trim().min(1).max(100),
  url: z.string().trim().min(1).max(2000),
});
export type AboutSocial = z.infer<typeof AboutSocial>;

export const AboutCeoInfo = z.strictObject({
  name: Title,
  about: Text,
  image: MediaUrl,
  social: z.array(AboutSocial),
});
export type AboutCeoInfo = z.infer<typeof AboutCeoInfo>;

export const AboutCta = z.strictObject({
  title: Title,
  description: Text,
  img: MediaUrl,
});
export type AboutCta = z.infer<typeof AboutCta>;

export const AboutFaqItem = z.strictObject({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});
export type AboutFaqItem = z.infer<typeof AboutFaqItem>;

export const AboutFaq = z.strictObject({
  title: Title,
  description: Text,
  faqs: z.array(AboutFaqItem),
});
export type AboutFaq = z.infer<typeof AboutFaq>;

export const AboutInfoBlock = z.strictObject({
  title: Title,
  description: Text,
  image: MediaUrl,
});
export type AboutInfoBlock = z.infer<typeof AboutInfoBlock>;

// Per-type writes. The route fixes `type`, so bodies omit it — same shape
// as .tmp About / ESG_CSR / CAREERS.
const Slug = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens");

const FileId = z.string().trim().min(1).max(500).optional();

export const AboutBody = z.strictObject({
  name: Title,
  slug: Slug,
  image: MediaUrl,
  imageFileId: FileId,
  whoWeAre: AboutWhoWeAre.optional(),
  whyUs: AboutWhyUs.optional(),
  ceoInfo: AboutCeoInfo.optional(),
  cta: AboutCta.optional(),
  faq: AboutFaq.optional(),
  status: ContentStatus.optional(),
});
export type AboutBody = z.infer<typeof AboutBody>;

export const AboutCreate = z.preprocess(normalizeAboutInput, AboutBody);
export type AboutCreate = z.infer<typeof AboutCreate>;

export const EsgCsrBody = z.strictObject({
  name: Title,
  slug: Slug,
  image: MediaUrl,
  imageFileId: FileId,
  title: Title.optional(),
  description: Text.optional(),
  infoBlock: z.array(AboutInfoBlock).optional(),
  cta: AboutCta.optional(),
  status: ContentStatus.optional(),
});
export type EsgCsrBody = z.infer<typeof EsgCsrBody>;

export const EsgCsrCreate = z.preprocess(normalizeAboutInput, EsgCsrBody);
export type EsgCsrCreate = z.infer<typeof EsgCsrCreate>;

export const CareersBody = z.strictObject({
  name: Title,
  slug: Slug,
  image: MediaUrl,
  imageFileId: FileId,
  bannerImg: MediaUrl.optional(),
  bannerImgFileId: FileId,
  infoBlock: z.array(AboutInfoBlock).optional(),
  status: ContentStatus.optional(),
});
export type CareersBody = z.infer<typeof CareersBody>;

export const CareersCreate = z.preprocess(normalizeAboutInput, CareersBody);
export type CareersCreate = z.infer<typeof CareersCreate>;

// Outputs mirror the inputs; image URL fields become objects.
const CounterOut = z.strictObject({
  number: z.string(),
  title: z.string(),
});

const WhoWeAreOut = z.strictObject({
  description: z.string(),
  img: ImageObject.nullable(),
  counter: z.array(CounterOut),
});

const WhyUsItemOut = z.strictObject({
  icon: ImageObject.nullable(),
  title: z.string(),
  description: z.string(),
});

const CeoInfoOut = z.strictObject({
  name: z.string(),
  about: z.string(),
  image: ImageObject.nullable(),
  social: z.array(
    z.strictObject({ type: z.string(), url: z.string() }),
  ),
});

const CtaOut = z.strictObject({
  title: z.string(),
  description: z.string(),
  img: ImageObject.nullable(),
});

const InfoBlockOut = z.strictObject({
  title: z.string(),
  description: z.string(),
  image: ImageObject.nullable(),
});

export const Item = z.object({
  id: z.string(),
  name: z.string(),
  type: AboutPageType,
  slug: z.string(),
  image: ImageObject.nullable(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  whoWeAre: WhoWeAreOut.nullable().optional(),
  whyUs: z
    .strictObject({
      title: z.string(),
      description: z.string(),
      items: z.array(WhyUsItemOut),
    })
    .nullable()
    .optional(),
  ceoInfo: CeoInfoOut.nullable().optional(),
  cta: CtaOut.nullable().optional(),
  faq: z
    .strictObject({
      title: z.string(),
      description: z.string(),
      faqs: z.array(AboutFaqItem),
    })
    .nullable()
    .optional(),
  infoBlock: z.array(InfoBlockOut).optional(),
  bannerImg: ImageObject.nullable().optional(),
  status: ContentStatus,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Item = z.infer<typeof Item>;
