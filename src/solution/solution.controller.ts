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
import { ResponseMessage } from "../common/decorators/response-message.decorator.js";
import { ApiEnvelope } from "../common/swagger/api-envelope.decorator.js";
import { objectIdSchema } from "../common/validation/object-id.js";
import { SOLUTION_MESSAGES } from "./solution.messages.js";
import { SolutionService } from "./solution.service.js";
import * as SolutionDto from "./solution.validation.js";

@ApiTags("solutions")
@ApiCookieAuth("access_token")
@Controller("solutions")
export class SolutionController {
  constructor(private readonly service: SolutionService) {}

  @Public()
  @Get()
  @ResponseMessage(SOLUTION_MESSAGES.LIST_FETCHED)
  @ApiOperation({ summary: "List solutions" })
  @ApiEnvelope(SolutionDto.Item, { paginated: true })
  list(@Query({ schema: SolutionDto.ListQuery }) query: SolutionDto.ListQuery) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(":id")
  @ResponseMessage(SOLUTION_MESSAGES.FETCHED)
  @ApiOperation({ summary: "Get a solution" })
  @ApiEnvelope(SolutionDto.Item)
  get(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @HttpCode(201)
  @ResponseMessage(SOLUTION_MESSAGES.CREATED)
  @ApiOperation({ summary: "Create a solution" })
  @ApiEnvelope(SolutionDto.Item, { status: 201 })
  create(@Body({ schema: SolutionDto.Create }) dto: SolutionDto.Create) {
    return this.service.create(dto);
  }

  @Put(":id")
  @ResponseMessage(SOLUTION_MESSAGES.UPDATED)
  @ApiOperation({ summary: "Update a solution" })
  @ApiEnvelope(SolutionDto.Item)
  update(
    @Param("id", { schema: objectIdSchema }) id: string,
    @Body({ schema: SolutionDto.Update }) dto: SolutionDto.Update,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ResponseMessage(SOLUTION_MESSAGES.DELETED)
  @ApiOperation({ summary: "Delete a solution" })
  @ApiEnvelope(null)
  remove(@Param("id", { schema: objectIdSchema }) id: string) {
    return this.service.remove(id);
  }
}
