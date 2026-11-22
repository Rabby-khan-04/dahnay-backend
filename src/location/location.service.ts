import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  pageArgs,
  toPaginated,
} from "../common/pagination/pagination.js";
import { LOCATION_MESSAGES } from "./location.messages.js";
import type * as LocationDto from "./location.validation.js";

const NOT_FOUND = [
  LOCATION_MESSAGES.NOT_FOUND,
  "LOCATION_NOT_FOUND",
] as const;

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LocationDto.ListQuery) {
    const { search, sortBy, order, country, status, ...paging } = query;
    const where: Prisma.LocationWhereInput = {
      ...(search
        ? { city: { contains: search, mode: "insensitive" } }
        : {}),
      ...(country ? { country } : {}),
      ...(status ? { status } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        orderBy: [
          { [sortBy]: order } as Prisma.LocationOrderByWithRelationInput,
          { id: order },
        ],
        ...pageArgs(paging),
      }),
      this.prisma.location.count({ where }),
    ]);
    return toPaginated(items, total, paging);
  }

  findById(id: string) {
    return orNotFound(
      this.prisma.location.findUniqueOrThrow({ where: { id } }),
      ...NOT_FOUND,
    );
  }

  create(dto: LocationDto.Create) {
    return this.prisma.location.create({
      data: dto as Prisma.LocationUncheckedCreateInput,
    });
  }

  update(id: string, dto: LocationDto.Update) {
    return orNotFound(
      this.prisma.location.update({
        where: { id },
        data: dto as Prisma.LocationUncheckedUpdateInput,
      }),
      ...NOT_FOUND,
    );
  }

  async remove(id: string) {
    await orNotFound(
      this.prisma.location.delete({ where: { id } }),
      ...NOT_FOUND,
    );
    return null;
  }
}
