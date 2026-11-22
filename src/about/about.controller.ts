import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ResponseMessage } from "../common/decorators/response-message.decorator.js";
import { ApiEnvelope } from "../common/swagger/api-envelope.decorator.js";
import { PAGE_MESSAGES } from "../page/page.messages.js";
import { PageService } from "../page/page.service.js";
import * as PageDto from "../page/page.validation.js";

const ABOUT_PATH = "/about";
const ESG_CSR_PATH = "/esg-csr";
const CAREERS_PATH = "/careers";

@ApiTags("about")
@ApiCookieAuth("access_token")
@Controller()
export class AboutController {
  constructor(private readonly pages: PageService) {}

  @Public()
  @Get(ABOUT_PATH)
  @ResponseMessage(PAGE_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get the about page content" })
  @ApiEnvelope(PageDto.Item)
  getAbout() {
    return this.pages.findByPath(ABOUT_PATH);
  }

  @Post(ABOUT_PATH)
  @HttpCode(200)
  @Roles("ADMIN")
  @ResponseMessage(PAGE_MESSAGES.UPSERTED)
  @ApiOperation({ summary: "Create or replace the about page content" })
  @ApiEnvelope(PageDto.Item)
  saveAbout(@Body({ schema: PageDto.Upsert }) dto: PageDto.Upsert) {
    return this.pages.upsertByPath(ABOUT_PATH, dto);
  }

  @Public()
  @Get(ESG_CSR_PATH)
  @ResponseMessage(PAGE_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get the ESG/CSR page content" })
  @ApiEnvelope(PageDto.Item)
  getEsgCsr() {
    return this.pages.findByPath(ESG_CSR_PATH);
  }

  @Post(ESG_CSR_PATH)
  @HttpCode(200)
  @Roles("ADMIN")
  @ResponseMessage(PAGE_MESSAGES.UPSERTED)
  @ApiOperation({ summary: "Create or replace the ESG/CSR page content" })
  @ApiEnvelope(PageDto.Item)
  saveEsgCsr(@Body({ schema: PageDto.Upsert }) dto: PageDto.Upsert) {
    return this.pages.upsertByPath(ESG_CSR_PATH, dto);
  }

  @Public()
  @Get(CAREERS_PATH)
  @ResponseMessage(PAGE_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get the careers page content" })
  @ApiEnvelope(PageDto.Item)
  getCareers() {
    return this.pages.findByPath(CAREERS_PATH);
  }

  @Post(CAREERS_PATH)
  @HttpCode(200)
  @Roles("ADMIN")
  @ResponseMessage(PAGE_MESSAGES.UPSERTED)
  @ApiOperation({ summary: "Create or replace the careers page content" })
  @ApiEnvelope(PageDto.Item)
  saveCareers(@Body({ schema: PageDto.Upsert }) dto: PageDto.Upsert) {
    return this.pages.upsertByPath(CAREERS_PATH, dto);
  }
}
