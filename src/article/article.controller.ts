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
import { ARTICLE_MESSAGES } from "./article.messages.js";
import { ArticleService } from "./article.service.js";
import * as ArticleDto from "./article.validation.js";

@ApiTags("articles")
@ApiCookieAuth("access_token")
@Controller("articles")
export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  @Public()
  @Get()
  @ResponseMessage(ARTICLE_MESSAGES.LIST_FETCHED)
  @ApiOperation({ summary: "List articles" })
  @ApiEnvelope(ArticleDto.Item, { paginated: true })
  list(@Query({ schema: ArticleDto.ListQuery }) query: ArticleDto.ListQuery) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(":id")
  @ResponseMessage(ARTICLE_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get an article" })
  @ApiEnvelope(ArticleDto.Item)
  get(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @HttpCode(201)
  @Roles("ADMIN")
  @ResponseMessage(ARTICLE_MESSAGES.CREATED)
  @ApiOperation({ summary: "Create an article" })
  @ApiEnvelope(ArticleDto.Item, { status: 201 })
  create(@Body({ schema: ArticleDto.Create }) dto: ArticleDto.Create) {
    return this.service.create(dto);
  }

  @Put(":id")
  @Roles("ADMIN")
  @ResponseMessage(ARTICLE_MESSAGES.UPDATED)
  @ApiOperation({ summary: "Update an article" })
  @ApiEnvelope(ArticleDto.Item)
  update(
    @Param("id", { schema: objectIdSchema }) id: string,
    @Body({ schema: ArticleDto.Update }) dto: ArticleDto.Update,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ResponseMessage(ARTICLE_MESSAGES.DELETED)
  @ApiOperation({ summary: "Delete an article" })
  @ApiEnvelope(null)
  remove(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.remove(id);
  }
}
