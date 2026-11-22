import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { Prisma } from "../generated/prisma/client.js";
import { UsersService } from "../users/users.service.js";
import { AUTH_MESSAGES } from "./auth.messages.js";
import * as AuthDto from "./auth.validation.js";

@Injectable()
export class AuthService {
  // Compared against when the email is unknown, so timing does not reveal it.
  private readonly dummyHash = hash("not-a-real-password", 10);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: AuthDto.Register) {
    const passwordHash = await hash(dto.password, 10);
    try {
      const user = await this.users.create({
        email: dto.email,
        passwordHash,
        name: dto.name,
      });
      return safeUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(AUTH_MESSAGES.EMAIL_TAKEN, {
          errorCode: "AUTH_EMAIL_TAKEN",
        });
      }
      throw error;
    }
  }

  async login(dto: AuthDto.Login) {
    const user = await this.users.findByEmail(dto.email);
    const storedHash = user?.passwordHash ?? (await this.dummyHash);
    const valid = await compare(dto.password, storedHash);
    if (!user || !valid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS, {
        errorCode: "AUTH_INVALID_CREDENTIALS",
      });
    }

    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { token, user: safeUser(user) };
  }
}

function safeUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    role: user.role,
    createdAt: user.createdAt,
  };
}
