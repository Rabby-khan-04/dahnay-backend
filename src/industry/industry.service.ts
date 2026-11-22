import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { toImageObject } from "../media/media.service.js";
import {
  pageArgs,
  toPaginated,
} from "../common/pagination/pagination.js";
import { INDUSTRY_MESSAGES } from "./industry.messages.js";
import type * as IndustryDto from "./industry.validation.js";

const NOT_FOUND = [
  INDUSTRY_MESSAGES.NOT_FOUND,
  "INDUSTRY_NOT_FOUND",
] as const;

const MEDIA_NOT_FOUND = ["Media not found", "MEDIA_NOT_FOUND"] as const;

type IndustryRow = Prisma.IndustryGetPayload<Record<string, never>>;

@Injectable()
export class IndustryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IndustryDto.ListQuery) {
    const { search, sortBy, order, status, ...paging } = query;
    const where: Prisma.IndustryWhereInput = {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(status ? { status } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.industry.findMany({
        where,
        orderBy: [
          { [sortBy]: order } as Prisma.IndustryOrderByWithRelationInput,
          { id: order },
        ],
        ...pageArgs(paging),
      }),
      this.prisma.industry.count({ where }),
    ]);
    return toPaginated(await this.withResolvedImages(rows), total, paging);
  }

  async findById(id: string) {
    const item = await orNotFound(
      this.prisma.industry.findUniqueOrThrow({ where: { id } }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  async create(dto: IndustryDto.Create) {
    const { bannerImgFileId, ...rest } = dto;
    await this.registerMedia(rest.bannerImg, bannerImgFileId);
    const item = await this.prisma.industry.create({
      data: rest as Prisma.IndustryUncheckedCreateInput,
    });
    return (await this.withResolvedImages([item]))[0];
  }

  async update(id: string, dto: IndustryDto.Update) {
    const { bannerImgFileId, ...rest } = dto;
    if (rest.bannerImg !== undefined)
      await this.registerMedia(rest.bannerImg, bannerImgFileId);
    const item = await orNotFound(
      this.prisma.industry.update({
        where: { id },
        data: rest as Prisma.IndustryUncheckedUpdateInput,
      }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  async remove(id: string) {
    await orNotFound(
      this.prisma.industry.delete({ where: { id } }),
      ...NOT_FOUND,
    );
    return null;
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

  private async withResolvedImages(rows: IndustryRow[]) {
    const urls = new Set<string>();
    const take = (v: unknown) => {
      if (typeof v === "string" && v.trim().length > 0) urls.add(v);
    };
    for (const r of rows) {
      take(r.bannerImg);
      r.experties.features.forEach((f) => take(f.img));
      r.whyUs.items.forEach((i) => take(i.icon));
    }
    const media =
      urls.size > 0
        ? await this.prisma.media.findMany({ where: { src: { in: [...urls] } } })
        : [];
    const bySrc = new Map(media.map((m) => [m.src, toImageObject(m)]));
    const img = (url: string) => bySrc.get(url) ?? { id: null, link: url };
    return rows.map((r) => ({
      ...r,
      bannerImg: img(r.bannerImg),
      experties: {
        ...r.experties,
        features: r.experties.features.map((f) => ({ ...f, img: img(f.img) })),
      },
      whyUs: {
        ...r.whyUs,
        items: r.whyUs.items.map((i) => ({ ...i, icon: img(i.icon) })),
      },
    }));
  }
}
