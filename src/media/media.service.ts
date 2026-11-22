import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  pageArgs,
  toPaginated,
} from "../common/pagination/pagination.js";
import { MEDIA_MESSAGES } from "./media.messages.js";
import type * as MediaDto from "./media.validation.js";

const NOT_FOUND = [MEDIA_MESSAGES.NOT_FOUND, "MEDIA_NOT_FOUND"] as const;

type MediaRow = Prisma.MediaGetPayload<Record<string, never>>;

export function toImageObject(
  media: Pick<MediaRow, "id" | "src" | "width" | "height" | "title" | "alt">,
): MediaDto.ImageObject {
  return {
    id: media.id,
    link: media.src,
    width: media.width ?? null,
    height: media.height ?? null,
    title: media.title ?? null,
    alt: media.alt ?? null,
  };
}

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: MediaDto.ListQuery) {
    const { search, sortBy, order, kind, ...paging } = query;
    const where: Prisma.MediaWhereInput = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { src: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(kind ? { kind } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: [
          { [sortBy]: order } as Prisma.MediaOrderByWithRelationInput,
          { id: order },
        ],
        ...pageArgs(paging),
      }),
      this.prisma.media.count({ where }),
    ]);
    return toPaginated(await this.withPosters(items), total, paging);
  }

  async findById(id: string) {
    const item = await orNotFound(
      this.prisma.media.findUniqueOrThrow({ where: { id } }),
      ...NOT_FOUND,
    );
    return (await this.withPosters([item]))[0];
  }

  async create(dto: MediaDto.Create) {
    const item = await this.prisma.media.create({
      data: dto as Prisma.MediaUncheckedCreateInput,
    });
    return (await this.withPosters([item]))[0];
  }

  async update(id: string, dto: MediaDto.Update) {
    const item = await orNotFound(
      this.prisma.media.update({
        where: { id },
        data: dto as Prisma.MediaUncheckedUpdateInput,
      }),
      ...NOT_FOUND,
    );
    return (await this.withPosters([item]))[0];
  }

  async remove(id: string) {
    await orNotFound(
      this.prisma.media.delete({ where: { id } }),
      ...NOT_FOUND,
    );
    return null;
  }

  private async withPosters(items: MediaRow[]) {
    const posterIds = [
      ...new Set(items.map((i) => i.posterId).filter((v) => v != null)),
    ];
    const posters =
      posterIds.length > 0
        ? await this.prisma.media.findMany({
            where: { id: { in: posterIds as string[] } },
          })
        : [];
    const byId = new Map(posters.map((p) => [p.id, toImageObject(p)]));
    return items.map(({ posterId, ...rest }) => ({
      ...rest,
      poster: posterId != null ? (byId.get(posterId) ?? null) : null,
    }));
  }
}
