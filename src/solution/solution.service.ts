import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { PrismaService } from "../prisma/prisma.service.js";
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
    const [items, total] = await Promise.all([
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
    return toPaginated(items, total, paging);
  }

  findById(id: string) {
    return orNotFound(
      this.prisma.solution.findUniqueOrThrow({ where: { id } }),
      ...NOT_FOUND,
    );
  }

  create(dto: SolutionDto.Create) {
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
    return this.prisma.solution.create({ data });
  }

  update(id: string, dto: SolutionDto.Update) {
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
      this.prisma.solution.update({ where: { id }, data }),
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
