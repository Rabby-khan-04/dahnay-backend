import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { toImageObject } from "../media/media.service.js";
import { ContactBody, HomeBody } from "./page.validation.js";
import { PAGE_MESSAGES } from "./page.messages.js";
import type * as PageDto from "./page.validation.js";

const NOT_FOUND = [PAGE_MESSAGES.NOT_FOUND, "PAGE_NOT_FOUND"] as const;

// Output keys per page type: body fields (minus input-only companions)
// plus row metadata. Responses contain exactly what each Item documents,
// so a GET body posts back verbatim.
const INPUT_ONLY = new Set(["files", "bannerImgFileId"]);
const META_KEYS = ["id", "slug", "createdAt", "updatedAt"];
const HOME_KEYS = [
  ...Object.keys(HomeBody.shape).filter((k) => !INPUT_ONLY.has(k)),
  ...META_KEYS,
];
const CONTACT_KEYS = [
  ...Object.keys(ContactBody.shape).filter((k) => !INPUT_ONLY.has(k)),
  ...META_KEYS,
];

const pick = (obj: Record<string, unknown>, keys: string[]) => {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
};

type PageRow = Prisma.PageGetPayload<Record<string, never>>;
type HomeCreate = PageDto.HomeCreate;
type ContactCreate = PageDto.ContactCreate;

@Injectable()
export class PageService {
  constructor(private readonly prisma: PrismaService) {}

  async findHome() {
    const item = await orNotFound(
      this.prisma.page.findUniqueOrThrow({ where: { slug: "home" } }),
      ...NOT_FOUND,
    );
    const [resolved] = await this.withResolvedImages([item]);
    return pick(resolved as Record<string, unknown>, HOME_KEYS);
  }

  async findContact() {
    const item = await orNotFound(
      this.prisma.page.findUniqueOrThrow({ where: { slug: "contact" } }),
      ...NOT_FOUND,
    );
    const [resolved] = await this.withResolvedImages([item]);
    return pick(resolved as Record<string, unknown>, CONTACT_KEYS);
  }

  async upsertHome(dto: PageDto.HomeCreate) {
    const { files, ...rest } = dto;
    await this.registerFiles(files);
    const { count } = await this.prisma.page.updateMany({
      where: { slug: "home" },
      data: rest as Prisma.PageUpdateManyMutationInput,
    });
    if (count === 0) {
      const created = await this.prisma.page.create({
        data: { ...rest, slug: "home" } as Prisma.PageUncheckedCreateInput,
      });
      const [resolved] = await this.withResolvedImages([created]);
      return pick(resolved as Record<string, unknown>, HOME_KEYS);
    }
    return this.findHome();
  }

  async upsertContact(dto: PageDto.ContactCreate) {
    const { files, bannerImgFileId, ...rest } = dto;
    await this.registerFiles(files);
    if (rest.bannerImg !== undefined)
      await this.registerOne(rest.bannerImg, bannerImgFileId);
    const { count } = await this.prisma.page.updateMany({
      where: { slug: "contact" },
      data: rest as Prisma.PageUpdateManyMutationInput,
    });
    if (count === 0) {
      const created = await this.prisma.page.create({
        data: { ...rest, slug: "contact" } as Prisma.PageUncheckedCreateInput,
      });
      const [resolved] = await this.withResolvedImages([created]);
      return pick(resolved as Record<string, unknown>, CONTACT_KEYS);
    }
    return this.findContact();
  }

  private async registerFiles(
    files: Array<{ src: string; fileId: string }> | undefined,
  ) {
    if (!files?.length) return;
    await Promise.all(
      files.map(({ src, fileId }) =>
        this.prisma.media.upsert({
          where: { src },
          update: { fileId },
          create: { src, fileId },
        }),
      ),
    );
  }

  private async registerOne(src: string | undefined, fileId: string | undefined) {
    if (!src || !fileId) return;
    await this.prisma.media.upsert({
      where: { src },
      update: { fileId },
      create: { src, fileId },
    });
  }

  private async withResolvedImages(rows: PageRow[]) {
    const urls = new Set<string>();
    const take = (v: unknown) => {
      if (typeof v === "string" && v.trim().length > 0) urls.add(v);
    };
    for (const r of rows) {
      take(r.bannerImg);
      r.banner?.forEach((b) => take(b.image));
      take(r.offer?.image);
      take(r.offer?.video);
      take(r.aboutUs?.image);
      take(r.aboutUs?.video);
      r.whyUs?.items.forEach((i) => take(i.icon));
      r.info?.images.forEach(take);
      take(r.info?.bannerImg);
      take(r.cta?.bannerImg);
    }
    const media =
      urls.size > 0
        ? await this.prisma.media.findMany({ where: { src: { in: [...urls] } } })
        : [];
    const bySrc = new Map(media.map((m) => [m.src, toImageObject(m)]));
    const img = (url: string | null | undefined) =>
      url ? (bySrc.get(url) ?? { id: null, link: url }) : null;
    const imgs = (urls: string[] | null | undefined) =>
      (urls ?? []).map((u) => bySrc.get(u) ?? { id: null, link: u });
    return rows.map((r) => ({
      ...r,
      bannerImg: r.bannerImg ? img(r.bannerImg) : null,
      banner: (r.banner ?? []).map((b) => ({ ...b, image: img(b.image) })),
      offer: r.offer
        ? {
            ...r.offer,
            image: r.offer.image ? img(r.offer.image) : null,
            video: r.offer.video ? img(r.offer.video) : null,
          }
        : null,
      solutions: r.solutions ?? null,
      aboutUs: r.aboutUs
        ? {
            ...r.aboutUs,
            video: img(r.aboutUs.video),
            image: img(r.aboutUs.image),
          }
        : null,
      whyUs: r.whyUs
        ? {
            ...r.whyUs,
            items: r.whyUs.items.map((i) => ({ ...i, icon: img(i.icon) })),
          }
        : null,
      info: r.info
        ? {
            ...r.info,
            images: imgs(r.info.images),
            bannerImg: img(r.info.bannerImg),
          }
        : null,
      cta: r.cta ? { ...r.cta, bannerImg: img(r.cta.bannerImg) } : null,
      faq: r.faq ?? null,
      counter: r.counter ?? [],
    }));
  }
}
