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
import { INDUSTRY_MESSAGES } from "./industry.messages.js";
import { IndustryService } from "./industry.service.js";
import * as IndustryDto from "./industry.validation.js";

@ApiTags("industries")
@ApiCookieAuth("access_token")
@Controller("industries")
export class IndustryController {
  constructor(private readonly service: IndustryService) {}

  @Public()
  @Get()
  @ResponseMessage(INDUSTRY_MESSAGES.LIST_FETCHED)
  @ApiOperation({ summary: "List industries" })
  @ApiEnvelope(IndustryDto.Item, { paginated: true })
  list(@Query({ schema: IndustryDto.ListQuery }) query: IndustryDto.ListQuery) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(":id")
  @ResponseMessage(INDUSTRY_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get an industry" })
  @ApiEnvelope(IndustryDto.Item)
  get(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @HttpCode(201)
  @Roles("ADMIN")
  @ResponseMessage(INDUSTRY_MESSAGES.CREATED)
  @ApiOperation({ summary: "Create an industry" })
  @ApiEnvelope(IndustryDto.Item, { status: 201 })
  create(@Body({ schema: IndustryDto.Create }) dto: IndustryDto.Create) {
    return this.service.create(dto);
  }

  @Put(":id")
  @Roles("ADMIN")
  @ResponseMessage(INDUSTRY_MESSAGES.UPDATED)
  @ApiOperation({ summary: "Update an industry" })
  @ApiEnvelope(IndustryDto.Item)
  update(
    @Param("id", { schema: objectIdSchema }) id: string,
    @Body({ schema: IndustryDto.Update }) dto: IndustryDto.Update,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ResponseMessage(INDUSTRY_MESSAGES.DELETED)
  @ApiOperation({ summary: "Delete an industry" })
  @ApiEnvelope(null)
  remove(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.remove(id);
  }
}
