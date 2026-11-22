import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { Env } from "../config/env.validation.js";
import { UsersService } from "../users/users.service.js";
import { ApiEnvelope } from "../common/swagger/api-envelope.decorator.js";
import { ResponseMessage } from "../common/decorators/response-message.decorator.js";
import { AUTH_MESSAGES } from "./auth.messages.js";
import { AuthService } from "./auth.service.js";
import * as AuthDto from "./auth.validation.js";
import { accessCookieOptions } from "./cookie-options.js";
import { Public } from "./decorators/public.decorator.js";

interface JwtUser {
  sub: string;
  email: string;
  role: string;
}
type AuthedRequest = Request & { user: JwtUser };

@ApiTags("auth")
@ApiCookieAuth("access_token")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Post("register")
  @HttpCode(201)
  @ResponseMessage(AUTH_MESSAGES.REGISTERED)
  @ApiOperation({ summary: "Register a user" })
  @ApiEnvelope(AuthDto.UserItem, { status: 201 })
  register(@Body({ schema: AuthDto.Register }) dto: AuthDto.Register) {
    return this.auth.register(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  @ResponseMessage(AUTH_MESSAGES.LOGGED_IN)
  @ApiOperation({ summary: "Log in and set the access cookie" })
  @ApiEnvelope(AuthDto.UserItem)
  async login(
    @Body({ schema: AuthDto.Login }) dto: AuthDto.Login,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.auth.login(dto);
    res.cookie("access_token", token, this.cookieOptions());
    return user;
  }

  @Post("logout")
  @HttpCode(200)
  @ResponseMessage(AUTH_MESSAGES.LOGGED_OUT)
  @ApiOperation({ summary: "Log out and clear the access cookie" })
  @ApiEnvelope(null)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token", this.cookieOptions());
    return null;
  }

  @Get("me")
  @ResponseMessage(AUTH_MESSAGES.CURRENT_USER)
  @ApiOperation({ summary: "Current user" })
  @ApiEnvelope(AuthDto.UserItem)
  me(@Req() req: AuthedRequest) {
    return this.users.findById(req.user.sub);
  }

  private cookieOptions() {
    return accessCookieOptions(
      this.config.getOrThrow<number>("JWT_EXPIRES_IN_SECONDS"),
      this.config.getOrThrow<string>("NODE_ENV") === "production",
    );
  }
}
