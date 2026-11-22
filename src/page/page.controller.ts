import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ResponseMessage } from "../common/decorators/response-message.decorator.js";
import { ApiEnvelope } from "../common/swagger/api-envelope.decorator.js";
import { objectIdSchema } from "../common/validation/object-id.js";
import { PAGE_MESSAGES } from "./page.messages.js";
import { PageService } from "./page.service.js";
import * as PageDto from "./page.validation.js";

@ApiTags("pages")
@ApiCookieAuth("access_token")
@Controller("pages")
export class PageController {
  constructor(private readonly service: PageService) {}

  @Public()
  @Get()
  @ResponseMessage(PAGE_MESSAGES.LIST_FETCHED)
  @ApiOperation({ summary: "List pages" })
  @ApiEnvelope(PageDto.Item)
  list(@Query({ schema: PageDto.ListQuery }) query: PageDto.ListQuery) {
    return this.service.findAll(query);
  }

  @Public()
  @Get("by-path")
  @ResponseMessage(PAGE_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get a page by its path" })
  @ApiEnvelope(PageDto.Item)
  getByPath(@Query({ schema: PageDto.ByPath }) query: PageDto.ByPath) {
    return this.service.findByPath(query.path);
  }

  @Public()
  @Get(":id")
  @ResponseMessage(PAGE_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get a page" })
  @ApiEnvelope(PageDto.Item)
  get(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @HttpCode(201)
  @Roles("ADMIN")
  @ResponseMessage(PAGE_MESSAGES.CREATED)
  @ApiOperation({ summary: "Create a page" })
  @ApiEnvelope(PageDto.Item, { status: 201 })
  create(@Body({ schema: PageDto.Create }) dto: PageDto.Create) {
    return this.service.create(dto);
  }

  @Put("by-path")
  @Roles("ADMIN")
  @ResponseMessage(PAGE_MESSAGES.UPSERTED)
  @ApiOperation({ summary: "Create or replace a page by its path" })
  @ApiEnvelope(PageDto.Item)
  upsertByPath(
    @Query({ schema: PageDto.ByPath }) query: PageDto.ByPath,
    @Body({ schema: PageDto.Upsert }) dto: PageDto.Upsert,
  ) {
    return this.service.upsertByPath(query.path, dto);
  }

  @Put(":id")
  @Roles("ADMIN")
  @ResponseMessage(PAGE_MESSAGES.UPDATED)
  @ApiOperation({ summary: "Update a page" })
  @ApiEnvelope(PageDto.Item)
  update(
    @Param("id", { schema: objectIdSchema }) id: string,
    @Body({ schema: PageDto.Update }) dto: PageDto.Update,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ResponseMessage(PAGE_MESSAGES.DELETED)
  @ApiOperation({ summary: "Delete a page" })
  @ApiEnvelope(null)
  remove(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.remove(id);
  }
}
