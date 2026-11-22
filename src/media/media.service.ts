import type * as MediaDto from "./media.validation.js";

type MediaRow = Pick<{ id: string; src: string }, "id" | "src">;

export function toImageObject(media: MediaRow): MediaDto.ImageObject;
export function toImageObject(media: null | undefined): null;
export function toImageObject(
  media: MediaRow | null | undefined,
): MediaDto.ImageObject | null;
export function toImageObject(
  media: MediaRow | null | undefined,
): MediaDto.ImageObject | null {
  if (!media) return null;
  return { id: media.id, link: media.src };
}
