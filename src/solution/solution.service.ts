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

type SolutionWithImage = Prisma.SolutionGetPayload<{
  include: { image: true };
}>;

const withImageObject = ({
  imageId,
  image,
  ...rest
}: SolutionWithImage) => ({
  ...rest,
  image: image ? toImageObject(image) : null,
});

@Injectable()
export class SolutionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SolutionDto.ListQuery) {
    const { search, sortBy, order, kind, status, ...paging } = query;
    const where: Prisma.SolutionWhereInput = {
      ...(search
        ? { title: { contains: search, mode: "insensitive" } }
        : {}),
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
        include: { image: true },
        ...pageArgs(paging),
      }),
      this.prisma.solution.count({ where }),
    ]);
    return toPaginated(rows.map(withImageObject), total, paging);
  }

  private requireMedia(imageId: string) {
    return orNotFound(
      this.prisma.media.findUniqueOrThrow({ where: { id: imageId } }),
      ...MEDIA_NOT_FOUND,
    );
  }

  async findById(id: string) {
    const item = await orNotFound(
      this.prisma.solution.findUniqueOrThrow({
        where: { id },
        include: { image: true },
      }),
      ...NOT_FOUND,
    );
    return withImageObject(item);
  }

  async create(dto: SolutionDto.Create) {
    await this.requireMedia(dto.imageId);
    const { imageId, detail, ...rest } = dto;
    const data: Prisma.SolutionUncheckedCreateInput = {
      ...rest,
      imageId,
      detail: {
        intro: detail.intro,
        sections: detail.sections.map((s) => ({
          ...s,
          content: s.content as Prisma.InputJsonValue,
        })),
      },
    };
    const item = await this.prisma.solution.create({
      data,
      include: { image: true },
    });
    return withImageObject(item);
  }

  async update(id: string, dto: SolutionDto.Update) {
    if (dto.imageId !== undefined) await this.requireMedia(dto.imageId);
    const { imageId, detail, ...rest } = dto;
    const data: Prisma.SolutionUncheckedUpdateInput = {
      ...rest,
      ...(imageId !== undefined ? { imageId } : {}),
      ...(detail !== undefined
        ? {
            detail: {
              intro: detail.intro,
              sections:
                detail.sections?.map((s) => ({
                  ...s,
                  content: s.content as Prisma.InputJsonValue,
                })) ?? [],
            },
          }
        : {}),
    };
    return orNotFound(
      this.prisma.solution
        .update({
          where: { id },
          data,
          include: { image: true },
        })
        .then(withImageObject),
      ...NOT_FOUND,
    );
  }

  async remove(id: string) {
    await orNotFound(
      this.prisma.solution.delete({ where: { id } }),
      ...NOT_FOUND,
    );
    return null;
  }
}
