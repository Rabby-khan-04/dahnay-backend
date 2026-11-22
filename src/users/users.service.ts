import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Login lookup only: overrides the global passwordHash omit. */
  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      omit: { passwordHash: false },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { email: string; passwordHash: string; name?: string }) {
    return this.prisma.user.create({ data });
  }
}
