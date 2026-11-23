import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ResponseMessage } from "../common/decorators/response-message.decorator.js";
import { ApiEnvelope } from "../common/swagger/api-envelope.decorator.js";
import { PAGE_MESSAGES } from "../page/page.messages.js";
import { PageService } from "../page/page.service.js";
import * as PageDto from "../page/page.validation.js";

@ApiTags("contact")
@ApiCookieAuth("access_token")
@Controller("contact")
export class ContactController {
  constructor(private readonly pages: PageService) {}

  @Public()
  @Get()
  @ResponseMessage(PAGE_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get the contact page content" })
  @ApiEnvelope(PageDto.ContactItem)
  get() {
    return this.pages.findContact();
  }

  @Post()
  @HttpCode(200)
  @Roles("ADMIN")
  @ResponseMessage(PAGE_MESSAGES.UPSERTED)
  @ApiOperation({ summary: "Create or replace the contact page content" })
  @ApiEnvelope(PageDto.ContactItem)
  save(@Body({ schema: PageDto.ContactCreate }) dto: PageDto.ContactCreate) {
    return this.pages.upsertContact(dto);
  }
}
