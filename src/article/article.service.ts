import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { toImageObject } from "../media/media.service.js";
import {
  pageArgs,
  toPaginated,
} from "../common/pagination/pagination.js";
import { ARTICLE_MESSAGES } from "./article.messages.js";
import type * as ArticleDto from "./article.validation.js";

const NOT_FOUND = [ARTICLE_MESSAGES.NOT_FOUND, "ARTICLE_NOT_FOUND"] as const;

const MEDIA_NOT_FOUND = ["Media not found", "MEDIA_NOT_FOUND"] as const;

type ArticleRow = Prisma.ArticleGetPayload<Record<string, never>>;

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ArticleDto.ListQuery) {
    const { search, sortBy, order, type, status, ...paging } = query;
    const where: Prisma.ArticleWhereInput = {
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: [
          { [sortBy]: order } as Prisma.ArticleOrderByWithRelationInput,
          { id: order },
        ],
        ...pageArgs(paging),
      }),
      this.prisma.article.count({ where }),
    ]);
    return toPaginated(await this.withResolvedImages(rows), total, paging);
  }

  async findById(id: string) {
    const item = await orNotFound(
      this.prisma.article.findUniqueOrThrow({ where: { id } }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  async create(dto: ArticleDto.Create) {
    const { blogImgFileId, ...rest } = dto;
    await this.registerMedia(rest.blogImg, blogImgFileId);
    const item = await this.prisma.article.create({
      data: rest as Prisma.ArticleUncheckedCreateInput,
    });
    return (await this.withResolvedImages([item]))[0];
  }

  async update(id: string, dto: ArticleDto.Update) {
    const { blogImgFileId, ...rest } = dto;
    if (rest.blogImg !== undefined)
      await this.registerMedia(rest.blogImg, blogImgFileId);
    const item = await orNotFound(
      this.prisma.article.update({
        where: { id },
        data: rest as Prisma.ArticleUncheckedUpdateInput,
      }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  async remove(id: string) {
    await orNotFound(
      this.prisma.article.delete({ where: { id } }),
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

  private async withResolvedImages(rows: ArticleRow[]) {
    const srcs = [...new Set(rows.map((r) => r.blogImg).filter((v) => v))];
    const media =
      srcs.length > 0
        ? await this.prisma.media.findMany({ where: { src: { in: srcs } } })
        : [];
    const bySrc = new Map(media.map((m) => [m.src, toImageObject(m)]));
    return rows.map((r) => ({
      ...r,
      blogImg: bySrc.get(r.blogImg) ?? { id: null, link: r.blogImg },
    }));
  }
}
