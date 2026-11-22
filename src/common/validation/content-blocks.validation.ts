import { z } from "zod";
import { ImageObject } from "../../media/media.validation.js";

// Shared content blocks for solutions + industries.
// Field names follow .tmp/industries.ts with two fixes applied everywhere:
// `des` -> `description`, `anwser` -> `answer` (`img`, `bannerImg`,
// `faqs`/`qas` kept verbatim).
// Writes take plain URL strings; reads return the same keys holding
// `{ id, link }` objects (or null when the URL is unknown to the library).

export const MediaUrl = z.string().trim().min(1).max(2000);

const Title = z.string().trim().min(1).max(200);
const Text = z.string().trim().min(1);

// ---------------------------------------------------------------- inputs

export const Feature = z.strictObject({
  title: Title,
  description: Text,
  img: MediaUrl,
});
export type Feature = z.infer<typeof Feature>;

export const WhyUsItem = z.strictObject({
  icon: MediaUrl,
  title: Title,
  description: Text,
});
export type WhyUsItem = z.infer<typeof WhyUsItem>;

export const FaqItem = z.strictObject({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});
export type FaqItem = z.infer<typeof FaqItem>;

export const WhyUsBlock = z.strictObject({
  title: Title,
  items: z.array(WhyUsItem),
});
export type WhyUsBlock = z.infer<typeof WhyUsBlock>;

export const ExpertiseBlock = z.strictObject({
  title: Title,
  description: Text.optional(),
  features: z.array(Feature),
});
export type ExpertiseBlock = z.infer<typeof ExpertiseBlock>;

// Industry requires what solution leaves optional.
export const IndustryExpertise = ExpertiseBlock.extend({
  description: Text,
});
export type IndustryExpertise = z.infer<typeof IndustryExpertise>;

export const SolutionOverview = z.strictObject({
  title: Title,
  description: Text,
  img: MediaUrl,
});
export type SolutionOverview = z.infer<typeof SolutionOverview>;

export const SolutionServiceBlock = z.strictObject({
  title: Title,
  description: Text,
  services: z.array(Feature),
});
export type SolutionServiceBlock = z.infer<typeof SolutionServiceBlock>;

export const SolutionCertifications = z.strictObject({
  title: Title,
  description: Text,
  image: MediaUrl,
});
export type SolutionCertifications = z.infer<typeof SolutionCertifications>;

export const SolutionFaq = z.strictObject({
  title: Title,
  description: Text,
  faqs: z.array(FaqItem),
});
export type SolutionFaq = z.infer<typeof SolutionFaq>;

export const IndustryOverview = z.strictObject({
  title: Title,
  description: Text,
});
export type IndustryOverview = z.infer<typeof IndustryOverview>;

export const IndustryFaq = z.strictObject({
  title: Title,
  description: Text,
  qas: z.array(FaqItem),
});
export type IndustryFaq = z.infer<typeof IndustryFaq>;

// ---------------------------------------------------------------- outputs

export const FeatureOut = z.strictObject({
  title: z.string(),
  description: z.string(),
  img: ImageObject.nullable(),
});
export type FeatureOut = z.infer<typeof FeatureOut>;

export const WhyUsItemOut = z.strictObject({
  icon: ImageObject.nullable(),
  title: z.string(),
  description: z.string(),
});
export type WhyUsItemOut = z.infer<typeof WhyUsItemOut>;

export const WhyUsBlockOut = z.strictObject({
  title: z.string(),
  items: z.array(WhyUsItemOut),
});
export type WhyUsBlockOut = z.infer<typeof WhyUsBlockOut>;

export const ExpertiseBlockOut = z.strictObject({
  title: z.string(),
  description: z.string().nullable().optional(),
  features: z.array(FeatureOut),
});
export type ExpertiseBlockOut = z.infer<typeof ExpertiseBlockOut>;

export const SolutionOverviewOut = z.strictObject({
  title: z.string(),
  description: z.string(),
  img: ImageObject.nullable(),
});
export type SolutionOverviewOut = z.infer<typeof SolutionOverviewOut>;

export const SolutionServiceBlockOut = z.strictObject({
  title: z.string(),
  description: z.string(),
  services: z.array(FeatureOut),
});
export type SolutionServiceBlockOut = z.infer<typeof SolutionServiceBlockOut>;

export const SolutionCertificationsOut = z.strictObject({
  title: z.string(),
  description: z.string(),
  image: ImageObject.nullable(),
});
export type SolutionCertificationsOut =
  z.infer<typeof SolutionCertificationsOut>;

export const SolutionFaqOut = z.strictObject({
  title: z.string(),
  description: z.string(),
  faqs: z.array(FaqItem),
});
export type SolutionFaqOut = z.infer<typeof SolutionFaqOut>;

export const IndustryOverviewOut = z.strictObject({
  title: z.string(),
  description: z.string(),
});
export type IndustryOverviewOut = z.infer<typeof IndustryOverviewOut>;

export const IndustryFaqOut = z.strictObject({
  title: z.string(),
  description: z.string(),
  qas: z.array(FaqItem),
});
export type IndustryFaqOut = z.infer<typeof IndustryFaqOut>;
