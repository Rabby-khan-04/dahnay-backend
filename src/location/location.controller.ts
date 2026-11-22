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
import { LOCATION_MESSAGES } from "./location.messages.js";
import { LocationService } from "./location.service.js";
import * as LocationDto from "./location.validation.js";

@ApiTags("locations")
@ApiCookieAuth("access_token")
@Controller("locations")
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Public()
  @Get()
  @ResponseMessage(LOCATION_MESSAGES.LIST_FETCHED)
  @ApiOperation({ summary: "List locations" })
  @ApiEnvelope(LocationDto.Item, { paginated: true })
  list(@Query({ schema: LocationDto.ListQuery }) query: LocationDto.ListQuery) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(":id")
  @ResponseMessage(LOCATION_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get a location" })
  @ApiEnvelope(LocationDto.Item)
  get(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @HttpCode(201)
  @Roles("ADMIN")
  @ResponseMessage(LOCATION_MESSAGES.CREATED)
  @ApiOperation({ summary: "Create a location" })
  @ApiEnvelope(LocationDto.Item, { status: 201 })
  create(@Body({ schema: LocationDto.Create }) dto: LocationDto.Create) {
    return this.service.create(dto);
  }

  @Put(":id")
  @Roles("ADMIN")
  @ResponseMessage(LOCATION_MESSAGES.UPDATED)
  @ApiOperation({ summary: "Update a location" })
  @ApiEnvelope(LocationDto.Item)
  update(
    @Param("id", { schema: objectIdSchema }) id: string,
    @Body({ schema: LocationDto.Update }) dto: LocationDto.Update,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ResponseMessage(LOCATION_MESSAGES.DELETED)
  @ApiOperation({ summary: "Delete a location" })
  @ApiEnvelope(null)
  remove(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.remove(id);
  }
}
