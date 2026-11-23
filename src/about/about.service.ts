import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { toImageObject } from "../media/media.service.js";
import { ABOUT_MESSAGES } from "./about.messages.js";
import type * as AboutDto from "./about.validation.js";

const NOT_FOUND = [ABOUT_MESSAGES.NOT_FOUND, "ABOUT_PAGE_NOT_FOUND"] as const;

const MEDIA_NOT_FOUND = ["Media not found", "MEDIA_NOT_FOUND"] as const;

type AboutPageRow = Prisma.AboutPageGetPayload<Record<string, never>>;

type CreateDto =
  | AboutDto.AboutCreate
  | AboutDto.EsgCsrCreate
  | AboutDto.CareersCreate;

@Injectable()
export class AboutPageService {
  constructor(private readonly prisma: PrismaService) {}

  async findByType(type: AboutDto.AboutPageType) {
    const item = await orNotFound(
      this.prisma.aboutPage.findUniqueOrThrow({ where: { type } }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  async upsertByType(type: AboutDto.AboutPageType, dto: CreateDto) {
    const { imageFileId, bannerImgFileId, ...rest } = dto as CreateDto & {
      imageFileId?: string;
      bannerImgFileId?: string;
    };
    await this.registerMedia(rest.image, imageFileId);
    if ("bannerImg" in rest && rest.bannerImg !== undefined)
      await this.registerMedia(rest.bannerImg, bannerImgFileId);
    // updateMany first: it never materializes rows, so it also heals rows
    // whose stored shapes predate a schema change (a read-first upsert
    // would throw P2023 on those instead).
    const { count } = await this.prisma.aboutPage.updateMany({
      where: { type },
      data: rest as Prisma.AboutPageUpdateManyMutationInput,
    });
    if (count === 0) {
      const created = await this.prisma.aboutPage.create({
        data: { ...rest, type } as Prisma.AboutPageUncheckedCreateInput,
      });
      return (await this.withResolvedImages([created]))[0];
    }
    const item = await orNotFound(
      this.prisma.aboutPage.findUniqueOrThrow({ where: { type } }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  private async registerMedia(src: string, fileId?: string) {
    if (fileId !== undefined) {
      await this.prisma.media.upsert({
        where: { src },
        update: { fileId },
        create: { src, fileId },
      });
      return;
    }
    await orNotFound(
      this.prisma.media.findUniqueOrThrow({ where: { src } }),
      ...MEDIA_NOT_FOUND,
    );
  }

  private async withResolvedImages(rows: AboutPageRow[]) {
    const urls = new Set<string>();
    const take = (v: unknown) => {
      if (typeof v === "string" && v.trim().length > 0) urls.add(v);
    };
    for (const r of rows) {
      take(r.image);
      take(r.bannerImg);
      take(r.whoWeAre?.img);
      r.whyUs?.items.forEach((i) => take(i.icon));
      take(r.ceoInfo?.image);
      take(r.cta?.img);
      r.infoBlock.forEach((b) => take(b.image));
    }
    const media =
      urls.size > 0
        ? await this.prisma.media.findMany({ where: { src: { in: [...urls] } } })
        : [];
    const bySrc = new Map(media.map((m) => [m.src, toImageObject(m)]));
    const img = (url: string | null | undefined) =>
      url ? (bySrc.get(url) ?? { id: null, link: url }) : null;
    return rows.map((r) => ({
      ...r,
      image: img(r.image),
      bannerImg: r.bannerImg ? img(r.bannerImg) : null,
      whoWeAre: r.whoWeAre
        ? { ...r.whoWeAre, img: img(r.whoWeAre.img) }
        : r.whoWeAre,
      whyUs: r.whyUs
        ? {
            ...r.whyUs,
            items: r.whyUs.items.map((i) => ({ ...i, icon: img(i.icon) })),
          }
        : r.whyUs,
      ceoInfo: r.ceoInfo
        ? { ...r.ceoInfo, image: img(r.ceoInfo.image) }
        : r.ceoInfo,
      cta: r.cta ? { ...r.cta, img: img(r.cta.img) } : r.cta,
      infoBlock: r.infoBlock.map((b) => ({ ...b, image: img(b.image) })),
    }));
  }
}
