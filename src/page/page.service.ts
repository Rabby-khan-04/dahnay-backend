import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { orNotFound } from "../prisma/or-not-found.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { toImageObject } from "../media/media.service.js";
import type { ImageObject } from "../media/media.validation.js";
import { PAGE_MESSAGES } from "./page.messages.js";
import type * as PageDto from "./page.validation.js";

const NOT_FOUND = [PAGE_MESSAGES.NOT_FOUND, "PAGE_NOT_FOUND"] as const;

const toStoredSections = (
  sections: PageDto.Section[],
): Prisma.SectionCreateInput[] =>
  sections.map((s) => ({
    ...s,
    content: s.content as Prisma.InputJsonValue,
  }));

type PageRow = Prisma.PageGetPayload<Record<string, never>>;

type StoredSection = {
  id: string;
  type: string;
  visible: boolean;
  sortOrder: number;
  content: Record<string, any>;
};

// Content stores plain image URL strings (no relations). Any non-empty
// string found at a known media-ref path is a candidate for resolution.
const isMediaRef = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

type Img = (id: string) => ImageObject | null;

const withoutKey = (obj: Record<string, any>, key: string) => {
  const { [key]: _dropped, ...rest } = obj;
  return rest;
};

function resolveSection(section: StoredSection, img: Img): StoredSection {
  const { content } = section;
  switch (section.type) {
    case "HERO":
      return {
        ...section,
        content: {
          ...content,
          slides: (content.slides ?? []).map((s: any) => ({
            ...withoutKey(s, "imageId"),
            image: img(s.imageId),
          })),
        },
      };
    case "INTRO": {
      if (content.mediaId === undefined) return section;
      return {
        ...section,
        content: { ...withoutKey(content, "mediaId"), media: img(content.mediaId) },
      };
    }
    case "SERVICES":
    case "ICON_CARDS":
      return {
        ...section,
        content: {
          ...content,
          cards: (content.cards ?? []).map((c: any) => ({
            ...withoutKey(c, "imageId"),
            image: img(c.imageId),
          })),
        },
      };
    case "GPTW": {
      const { backgroundImageId, badgeIds, ...rest } = content;
      return {
        ...section,
        content: {
          ...rest,
          ...(backgroundImageId !== undefined
            ? { backgroundImage: img(backgroundImageId) }
            : {}),
          ...(badgeIds !== undefined
            ? { badges: badgeIds.map((id: string) => img(id)) }
            : {}),
        },
      };
    }
    case "CTA": {
      if (content.backgroundImageId === undefined) return section;
      return {
        ...section,
        content: {
          ...withoutKey(content, "backgroundImageId"),
          backgroundImage: img(content.backgroundImageId),
        },
      };
    }
    case "BANNER":
    case "PROFILE":
    case "CONTENT_BLOCK": {
      if (content.imageId === undefined) return section;
      return {
        ...section,
        content: { ...withoutKey(content, "imageId"), image: img(content.imageId) },
      };
    }
    default:
      return section;
  }
}

@Injectable()
export class PageService {
  constructor(private readonly prisma: PrismaService) {}

  private async withResolvedImages(rows: PageRow[]) {
    const urls = new Set<string>();
    const collect = (v: unknown) => {
      if (isMediaRef(v)) urls.add(v);
    };
    for (const row of rows) {
      collect((row.seo as { ogImageId?: unknown } | null)?.ogImageId);
      for (const s of row.sections as unknown as StoredSection[]) {
        const c = s.content;
        switch (s.type) {
          case "HERO":
            c.slides?.forEach((x: any) => collect(x?.imageId));
            break;
          case "INTRO":
            collect(c.mediaId);
            break;
          case "SERVICES":
          case "ICON_CARDS":
            c.cards?.forEach((x: any) => collect(x?.imageId));
            break;
          case "GPTW":
            collect(c.backgroundImageId);
            c.badgeIds?.forEach(collect);
            break;
          case "CTA":
            collect(c.backgroundImageId);
            break;
          case "BANNER":
          case "PROFILE":
          case "CONTENT_BLOCK":
            collect(c.imageId);
            break;
        }
      }
    }
    const media =
      urls.size > 0
        ? await this.prisma.media.findMany({ where: { src: { in: [...urls] } } })
        : [];
    const bySrc = new Map(media.map((m) => [m.src, toImageObject(m)]));
    const img: Img = (ref) => bySrc.get(ref) ?? { id: null, link: ref };
    return rows.map((row) => {
      const { ogImageId, ...seoRest } = (row.seo ?? {}) as Record<string, any>;
      return {
        ...row,
        seo: {
          ...seoRest,
          ...(ogImageId !== undefined && ogImageId !== null
            ? { ogImage: img(ogImageId) }
            : {}),
        },
        sections: (row.sections as unknown as StoredSection[]).map((s) =>
          resolveSection(s, img),
        ),
      };
    });
  }

  async findAll(query: PageDto.ListQuery) {
    const { search, sortBy, order, type, status } = query;
    const where: Prisma.PageWhereInput = {
      ...(search
        ? { title: { contains: search, mode: "insensitive" } }
        : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    };
    return this.withResolvedImages(
      await this.prisma.page.findMany({
        where,
        orderBy: [
          { [sortBy]: order } as Prisma.PageOrderByWithRelationInput,
          { id: order },
        ],
      }),
    );
  }

  async findById(id: string) {
    const item = await orNotFound(
      this.prisma.page.findUniqueOrThrow({ where: { id } }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  async findByPath(path: string) {
    const item = await orNotFound(
      this.prisma.page.findUniqueOrThrow({ where: { path } }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([item]))[0];
  }

  async upsertByPath(path: string, dto: PageDto.Upsert) {
    const { parentId, sections, ...rest } = dto;
    const storedSections = toStoredSections(sections);
    const existing = await this.prisma.page.findUnique({
      where: { path },
    });
    if (!existing) {
      const data: Prisma.PageUncheckedCreateInput = {
        ...rest,
        path,
        ...(parentId !== undefined ? { parentId } : {}),
        sections: storedSections,
      };
      const created = await this.prisma.page.create({ data });
      return (await this.withResolvedImages([created]))[0];
    }
    const data: Prisma.PageUncheckedUpdateInput = {
      ...rest,
      ...(parentId !== undefined ? { parentId } : {}),
      sections: storedSections,
    };
    const updated = await orNotFound(
      this.prisma.page.update({ where: { path }, data }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([updated]))[0];
  }

  async create(dto: PageDto.Create) {
    const { parentId, sections, ...rest } = dto;
    const data: Prisma.PageUncheckedCreateInput = {
      ...rest,
      ...(parentId !== undefined ? { parentId } : {}),
      sections: toStoredSections(sections),
    };
    const created = await this.prisma.page.create({ data });
    return (await this.withResolvedImages([created]))[0];
  }

  async update(id: string, dto: PageDto.Update) {
    const { parentId, sections, ...rest } = dto;
    const data: Prisma.PageUncheckedUpdateInput = {
      ...rest,
      ...(parentId !== undefined ? { parentId } : {}),
      ...(sections !== undefined
        ? { sections: toStoredSections(sections) }
        : {}),
    };
    const updated = await orNotFound(
      this.prisma.page.update({ where: { id }, data }),
      ...NOT_FOUND,
    );
    return (await this.withResolvedImages([updated]))[0];
  }

  async remove(id: string) {
    await orNotFound(
      this.prisma.page.delete({ where: { id } }),
      ...NOT_FOUND,
    );
    return null;
  }
}
