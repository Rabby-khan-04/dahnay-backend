import { NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";

export async function orNotFound<T>(
  operation: Promise<T>,
  message: string,
  errorCode: string,
): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundException(message, { errorCode });
    }
    throw error;
  }
}
