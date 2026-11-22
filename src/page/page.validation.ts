import { z } from "zod";
import { objectIdSchema } from "../common/validation/object-id.js";
import { ImageObject } from "../media/media.validation.js";
import { paginationQuerySchema } from "../common/pagination/pagination.js";

export const PageType = z.enum([
  "HOME",
  "SOLUTION",
  "ABOUT",
  "NEWSROOM",
  "CONTACT",
  "INDUSTRY",
]);
export type PageType = z.infer<typeof PageType>;

export const PageVariant = z.enum([
  "LOGISTICS",
  "LINES",
  "PORTS_INFRA",
  "WHO_WE_ARE",
  "ESG_CSR",
  "CAREERS",
  "BLOG",
  "CASE_STUDY",
  "NEWS",
]);
export type PageVariant = z.infer<typeof PageVariant>;

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

// ---------------------------------------------------------------------------
// Section contents — shapes from scraped/cms/content-model.types.ts
// (SectionContent map). CMS keys are lowercase; Prisma BlockType is uppercase.
// IDs embedded in content are plain image URL strings (no relations).
// Writes accept a URL string wherever a media ref is expected.
// ---------------------------------------------------------------------------

const MediaRef = z.string().trim().min(1);
const LinkItem = z.strictObject({
  label: z.string().trim().min(1),
  href: z.string().trim().min(1),
});
const CardField = z.enum([
  "image",
  "title",
  "shortDescription",
  "linkLabel",
  "anchor",
  "badge",
  "date",
  "excerpt",
]);

const HeroContent = z.strictObject({
  slides: z
    .array(
      z.strictObject({
        imageId: MediaRef,
        title: z.string().trim().min(1),
        description: z.string(),
      }),
    )
    .min(1),
});

const IntroContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  titleAccent: z.string().trim().min(1).optional(),
  body: z.string().trim().min(1),
  mediaId: MediaRef.optional(),
  link: LinkItem.optional(),
  variant: z.enum(["left", "centered"]).optional(),
  stats: z
    .array(
      z.strictObject({
        value: z.string().trim().min(1),
        label: z.string().trim().min(1),
      }),
    )
    .optional(),
});

const ServicesContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1).optional(),
  cards: z.array(
    z.strictObject({
      prefix: z.string().trim().min(1).optional(),
      title: z.string().trim().min(1),
      imageId: MediaRef,
      href: z.string().trim().min(1).optional(),
    }),
  ),
});

const IndustriesContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  cta: LinkItem.optional(),
  cardFields: z.array(CardField),
});

const IconCardsContent = z.strictObject({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  cards: z.array(
    z.strictObject({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      imageId: MediaRef,
    }),
  ),
});

const GptwContent = z.strictObject({
  title: z.string().trim().min(1),
  cta: LinkItem,
  backgroundImageId: MediaRef,
  badgeIds: z.array(MediaRef),
});

const NewsroomContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  titleAccent: z.string().trim().min(1).optional(),
  cta: LinkItem,
  articlePageIds: z.array(MediaRef),
});

const CtaContent = z.strictObject({
  title: z.string().trim().min(1),
  button: LinkItem,
  backgroundImageId: MediaRef.optional(),
});

const FaqContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  titleAccent: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  items: z.array(
    z.strictObject({
      question: z.string().trim().min(1),
      answer: z.string().trim().min(1),
    }),
  ),
});

const ContactFormContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  titleAccent: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(1).optional(),
});

const BannerContent = z.strictObject({
  imageId: MediaRef,
  title: z.string().trim().min(1).optional(),
  subtitle: z.string().trim().min(1).optional(),
});

const SolutionGridContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  descriptions: z.array(z.string().trim().min(1)),
  cta: LinkItem,
  kind: z.enum(["LOGISTICS", "LINES", "PORTS_INFRA"]),
  cardFields: z.array(CardField),
});

const FeatureListContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  items: z.array(
    z.strictObject({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
    }),
  ),
});

const ProfileContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  imageId: MediaRef,
});

const ContentBlockContent = z.strictObject({
  tag: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  imageId: MediaRef,
  reverse: z.boolean().optional(),
  link: LinkItem.optional(),
});

const CareerFormContent = z.strictObject({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
});

const ArticleListContent = z.strictObject({
  title: z.string().trim().min(1),
  type: z.enum(["BLOG", "CASE_STUDY", "NEWS"]),
  featuredCardFields: z.array(CardField),
  cardFields: z.array(CardField),
  pageSize: z.number().int().min(1),
  linkLabel: z.string().trim().min(1),
});

const NewsletterCtaContent = z.strictObject({
  heading: z.string().trim().min(1),
  buttonLabel: z.string().trim().min(1),
  socialTitle: z.string().trim().min(1),
  socialDescription: z.string().trim().min(1),
});

const ContactStatsContent = z.strictObject({
  stats: z.array(
    z.strictObject({
      value: z.string().trim().min(1),
      label: z.string().trim().min(1),
    }),
  ),
});

const OfficeListContent = z.strictObject({
  title: z.string().trim().min(1),
  titleAccent: z.string().trim().min(1).optional(),
  searchLabel: z.string().trim().min(1),
  filterLabel: z.string().trim().min(1),
  filters: z.array(z.string().trim().min(1)),
  groupByRegion: z.boolean(),
  cardFields: z.array(
    z.enum(["city", "country", "address", "phone", "email"]),
  ),
});

const BreadcrumbContent = z.strictObject({
  items: z.array(LinkItem),
});

const ArticleBodyContent = z.strictObject({
  body: z.array(z.unknown()),
});

// Dynamic sections, strict per type: any composition and order is allowed,
// but every block must match its own BlockType shape.
const sectionOf = <T extends BlockType, C extends z.ZodType>(
  type: T,
  content: C,
) =>
  z.strictObject({
    id: z.string().trim().min(1),
    type: z.literal(type),
    visible: z.boolean(),
    sortOrder: z.number().int().min(0),
    content,
  });

export const Section = z.discriminatedUnion("type", [
  sectionOf("HERO", HeroContent),
  sectionOf("INTRO", IntroContent),
  sectionOf("SERVICES", ServicesContent),
  sectionOf("INDUSTRIES", IndustriesContent),
  sectionOf("ICON_CARDS", IconCardsContent),
  sectionOf("GPTW", GptwContent),
  sectionOf("NEWSROOM", NewsroomContent),
  sectionOf("CTA", CtaContent),
  sectionOf("FAQ", FaqContent),
  sectionOf("CONTACT_FORM", ContactFormContent),
  sectionOf("BANNER", BannerContent),
  sectionOf("SOLUTION_GRID", SolutionGridContent),
  sectionOf("FEATURE_LIST", FeatureListContent),
  sectionOf("PROFILE", ProfileContent),
  sectionOf("CONTENT_BLOCK", ContentBlockContent),
  sectionOf("CAREER_FORM", CareerFormContent),
  sectionOf("ARTICLE_LIST", ArticleListContent),
  sectionOf("NEWSLETTER_CTA", NewsletterCtaContent),
  sectionOf("CONTACT_STATS", ContactStatsContent),
  sectionOf("OFFICE_LIST", OfficeListContent),
  sectionOf("BREADCRUMB", BreadcrumbContent),
  sectionOf("ARTICLE_BODY", ArticleBodyContent),
]);
export type Section = z.infer<typeof Section>;

export const SeoFields = z.strictObject({
  title: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  canonical: z.string().trim().max(500).nullable().optional(),
  robots: z.string().trim().max(100).nullable().optional(),
  ogImageId: z.string().trim().min(1).max(100).nullable().optional(),
});
export type SeoFields = z.infer<typeof SeoFields>;

// Accept what GET returns: wherever a write expects an image URL string,
// an image object `{ id, link }` (or array of them) is unwrapped to its URL.
// Prefers `link` (the stored value); falls back to `id` for legacy payloads.
// Lets an admin UI GET a page, edit text, and POST it back verbatim.
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

function normalizeContent(content: Record<string, any>): Record<string, any> {
  const out = { ...content };
  const take = (objKey: string, idKey: string) => {
    if (out[objKey] !== undefined) {
      const id = refOf(out[objKey]);
      delete out[objKey];
      if (id !== undefined) out[idKey] = id;
    }
  };
  take("image", "imageId");
  take("media", "mediaId");
  take("backgroundImage", "backgroundImageId");
  take("ogImage", "ogImageId");
  if (Array.isArray(out.badges)) {
    out.badgeIds = out.badges
      .map((b: unknown) => refOf(b))
      .filter((x): x is string => x !== undefined);
    delete out.badges;
  }
  for (const key of ["slides", "cards", "items", "stats"]) {
    if (Array.isArray(out[key])) {
      out[key] = out[key].map((x: unknown) =>
        x !== null && typeof x === "object"
          ? normalizeContent(x as Record<string, any>)
          : x,
      );
    }
  }
  return out;
}

const normalizeSections = (v: unknown) =>
  Array.isArray(v)
    ? v.map((s) =>
        s !== null && typeof s === "object" && "content" in s
          ? {
              ...(s as Record<string, any>),
              content: normalizeContent(
                (s as { content: Record<string, any> }).content ?? {},
              ),
            }
          : s,
      )
    : v;

const normalizeSeo = (v: unknown) =>
  v !== null && typeof v === "object"
    ? normalizeContent(v as Record<string, any>)
    : v;

export const Create = z.strictObject({
  type: PageType,
  variant: PageVariant.nullable().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  path: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine((p) => p.startsWith("/"), "Path must start with /"),
  title: z.string().trim().min(1).max(200),
  status: ContentStatus.optional(),
  parentId: objectIdSchema.nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  seo: z.preprocess(normalizeSeo, SeoFields),
  sections: z.preprocess(normalizeSections, z.array(Section)).default([]),
  publishedAt: z.iso.datetime().nullable().optional(),
});
export type Create = z.infer<typeof Create>;

export const Update = Create.partial();
export type Update = z.infer<typeof Update>;

// Page-wise write: full page document addressed by its path (upsert).
export const Upsert = Create.omit({ path: true });
export type Upsert = z.infer<typeof Upsert>;

export const ListQuery = paginationQuerySchema
  .omit({ page: true, limit: true })
  .extend({
    sortBy: z
      .enum(["sortOrder", "createdAt", "updatedAt", "title"])
      .default("sortOrder"),
    search: z.string().trim().min(1).optional(),
    type: PageType.optional(),
    status: ContentStatus.optional(),
  });
export type ListQuery = z.infer<typeof ListQuery>;

export const ByPath = z.strictObject({
  path: z.string().trim().min(1),
});
export type ByPath = z.infer<typeof ByPath>;

export const Item = z.object({
  id: z.string(),
  type: PageType,
  variant: PageVariant.nullable().optional(),
  slug: z.string(),
  path: z.string(),
  title: z.string(),
  status: ContentStatus,
  parentId: z.string().nullable().optional(),
  sortOrder: z.number(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    canonical: z.string().optional(),
    robots: z.string().optional(),
    ogImage: ImageObject.nullable().optional(),
  }),
  sections: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      visible: z.boolean(),
      sortOrder: z.number(),
      content: z.record(z.string(), z.unknown()),
    }),
  ),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().nullable().optional(),
});
export type Item = z.infer<typeof Item>;
