import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { toImageObject } from "../media/media.service.js";
import {
  pageArgs,
  toPaginated,
} from "../common/pagination/pagination.js";
import { SOLUTION_MESSAGES } from "./solution.messages.js";
import type * as SolutionDto from "./solution.validation.js";

const NOT_FOUND = [
  SOLUTION_MESSAGES.NOT_FOUND,
  "SOLUTION_NOT_FOUND",
] as const;

const MEDIA_NOT_FOUND = ["Media not found", "MEDIA_NOT_FOUND"] as const;

type SolutionRow = Prisma.SolutionGetPayload<Record<string, never>>;

type Img = (url: string) => { id: string | null; link: string };

async function collectUrls(
  prisma: PrismaService,
  rows: SolutionRow[],
): Promise<Map<string, { id: string | null; link: string }>> {
  const urls = new Set<string>();
  const take = (v: unknown) => {
    if (typeof v === "string" && v.trim().length > 0) urls.add(v);
  };
  for (const r of rows) {
    take(r.bannerImg);
    take(r.overview?.img);
    r.service?.services.forEach((s) => take(s.img));
    r.experties?.features.forEach((f) => take(f.img));
    r.whyUs?.items.forEach((i) => take(i.icon));
    take(r.certifications?.image);
  }
  if (urls.size === 0) return new Map();
  const media = await prisma.media.findMany({
    where: { src: { in: [...urls] } },
  });
  return new Map(media.map((m) => [m.src, toImageObject(m)]));
}

@Injectable()
export class SolutionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SolutionDto.ListQuery) {
    const { search, sortBy, order, kind, status, ...paging } = query;
    const where: Prisma.SolutionWhereInput = {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(kind ? { kind } : {}),
      ...(status ? { status } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.solution.findMany({
        where,
        orderBy: [
          { [sortBy]: order } as Prisma.SolutionOrderByWithRelationInput,
          { id: order },
        ],
        ...pageArgs(paging),
      }),
      this.prisma.solution.count({ where }),
    ]);
    return toPaginated(await this.withResolvedImages(rows), total, paging);
  }

  async findById(id: string) {
    const item = await orNotFound(
      this.prisma.solution.findUniqueOrThrow({ where: { id } }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  async create(dto: SolutionDto.Create) {
    const { bannerImgFileId, ...rest } = dto;
    await this.registerMedia(rest.bannerImg, bannerImgFileId);
    const item = await this.prisma.solution.create({
      data: rest as Prisma.SolutionUncheckedCreateInput,
    });
    return (await this.withResolvedImages([item]))[0];
  }

  async update(id: string, dto: SolutionDto.Update) {
    const { bannerImgFileId, ...rest } = dto;
    if (rest.bannerImg !== undefined)
      await this.registerMedia(rest.bannerImg, bannerImgFileId);
    const item = await orNotFound(
      this.prisma.solution.update({
        where: { id },
        data: rest as Prisma.SolutionUncheckedUpdateInput,
      }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  async remove(id: string) {
    await orNotFound(
      this.prisma.solution.delete({ where: { id } }),
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

  private async withResolvedImages(rows: SolutionRow[]) {
    const bySrc = await collectUrls(this.prisma, rows);
    const img: Img = (url) => bySrc.get(url) ?? { id: null, link: url };
    return rows.map((r) => ({
      ...r,
      bannerImg: img(r.bannerImg),
      overview: r.overview
        ? { ...r.overview, img: img(r.overview.img) }
        : r.overview,
      service: r.service
        ? {
            ...r.service,
            services: r.service.services.map((s) => ({
              ...s,
              img: img(s.img),
            })),
          }
        : r.service,
      experties: r.experties
        ? {
            ...r.experties,
            features: r.experties.features.map((f) => ({
              ...f,
              img: img(f.img),
            })),
          }
        : r.experties,
      whyUs: r.whyUs
        ? {
            ...r.whyUs,
            items: r.whyUs.items.map((i) => ({
              ...i,
              icon: img(i.icon),
            })),
          }
        : r.whyUs,
      certifications: r.certifications
        ? { ...r.certifications, image: img(r.certifications.image) }
        : r.certifications,
    }));
  }
}
