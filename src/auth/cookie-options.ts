import type { CookieOptions } from "express";

export function accessCookieOptions(
  maxAgeSeconds: number,
  isProduction: boolean,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: maxAgeSeconds * 1000,
  };
}
