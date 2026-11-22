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
import { MEDIA_MESSAGES } from "./media.messages.js";
import { MediaService } from "./media.service.js";
import * as MediaDto from "./media.validation.js";

@ApiTags("media")
@ApiCookieAuth("access_token")
@Controller("media")
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Public()
  @Get()
  @ResponseMessage(MEDIA_MESSAGES.LIST_FETCHED)
  @ApiOperation({ summary: "List media" })
  @ApiEnvelope(MediaDto.Item, { paginated: true })
  list(@Query({ schema: MediaDto.ListQuery }) query: MediaDto.ListQuery) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(":id")
  @ResponseMessage(MEDIA_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get a media item" })
  @ApiEnvelope(MediaDto.Item)
  get(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @HttpCode(201)
  @Roles("ADMIN")
  @ResponseMessage(MEDIA_MESSAGES.CREATED)
  @ApiOperation({ summary: "Create a media item" })
  @ApiEnvelope(MediaDto.Item, { status: 201 })
  create(@Body({ schema: MediaDto.Create }) dto: MediaDto.Create) {
    return this.service.create(dto);
  }

  @Put(":id")
  @Roles("ADMIN")
  @ResponseMessage(MEDIA_MESSAGES.UPDATED)
  @ApiOperation({ summary: "Update a media item" })
  @ApiEnvelope(MediaDto.Item)
  update(
    @Param("id", { schema: objectIdSchema }) id: string,
    @Body({ schema: MediaDto.Update }) dto: MediaDto.Update,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ResponseMessage(MEDIA_MESSAGES.DELETED)
  @ApiOperation({ summary: "Delete a media item" })
  @ApiEnvelope(null)
  remove(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.remove(id);
  }
}
