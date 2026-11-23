import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ResponseMessage } from "../common/decorators/response-message.decorator.js";
import { ApiEnvelope } from "../common/swagger/api-envelope.decorator.js";
import { PAGE_MESSAGES } from "../page/page.messages.js";
import { PageService } from "../page/page.service.js";
import * as PageDto from "../page/page.validation.js";

@ApiTags("home")
@ApiCookieAuth("access_token")
@Controller("home")
export class HomeController {
  constructor(private readonly pages: PageService) {}

  @Public()
  @Get()
  @ResponseMessage(PAGE_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get the home page content" })
  @ApiEnvelope(PageDto.HomeItem)
  get() {
    return this.pages.findHome();
  }

  @Post()
  @HttpCode(200)
  @Roles("ADMIN")
  @ResponseMessage(PAGE_MESSAGES.UPSERTED)
  @ApiOperation({ summary: "Create or replace the home page content" })
  @ApiEnvelope(PageDto.HomeItem)
  save(@Body({ schema: PageDto.HomeCreate }) dto: PageDto.HomeCreate) {
    return this.pages.upsertHome(dto);
  }
}
