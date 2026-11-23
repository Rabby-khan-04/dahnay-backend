import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ResponseMessage } from "../common/decorators/response-message.decorator.js";
import { ApiEnvelope } from "../common/swagger/api-envelope.decorator.js";
import { ABOUT_MESSAGES } from "./about.messages.js";
import { AboutPageService } from "./about.service.js";
import * as AboutDto from "./about.validation.js";

@ApiTags("about")
@ApiCookieAuth("access_token")
@Controller()
export class AboutController {
  constructor(private readonly pages: AboutPageService) {}

  @Public()
  @Get("about")
  @ResponseMessage(ABOUT_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get the about page content" })
  @ApiEnvelope(AboutDto.Item)
  getAbout() {
    return this.pages.findByType("ABOUT");
  }

  @Post("about")
  @HttpCode(200)
  @Roles("ADMIN")
  @ResponseMessage(ABOUT_MESSAGES.UPSERTED)
  @ApiOperation({ summary: "Create or replace the about page content" })
  @ApiEnvelope(AboutDto.Item)
  saveAbout(@Body({ schema: AboutDto.AboutCreate }) dto: AboutDto.AboutCreate) {
    return this.pages.upsertByType("ABOUT", dto);
  }

  @Public()
  @Get("esg-csr")
  @ResponseMessage(ABOUT_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get the ESG/CSR page content" })
  @ApiEnvelope(AboutDto.Item)
  getEsgCsr() {
    return this.pages.findByType("ESG_CSR");
  }

  @Post("esg-csr")
  @HttpCode(200)
  @Roles("ADMIN")
  @ResponseMessage(ABOUT_MESSAGES.UPSERTED)
  @ApiOperation({ summary: "Create or replace the ESG/CSR page content" })
  @ApiEnvelope(AboutDto.Item)
  saveEsgCsr(@Body({ schema: AboutDto.EsgCsrCreate }) dto: AboutDto.EsgCsrCreate) {
    return this.pages.upsertByType("ESG_CSR", dto);
  }

  @Public()
  @Get("careers")
  @ResponseMessage(ABOUT_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get the careers page content" })
  @ApiEnvelope(AboutDto.Item)
  getCareers() {
    return this.pages.findByType("CAREERS");
  }

  @Post("careers")
  @HttpCode(200)
  @Roles("ADMIN")
  @ResponseMessage(ABOUT_MESSAGES.UPSERTED)
  @ApiOperation({ summary: "Create or replace the careers page content" })
  @ApiEnvelope(AboutDto.Item)
  saveCareers(@Body({ schema: AboutDto.CareersCreate }) dto: AboutDto.CareersCreate) {
    return this.pages.upsertByType("CAREERS", dto);
  }
}
