import { Controller, Get } from "@nestjs/common";
import { ResponseMessage } from "./common/decorators/response-message.decorator.js";
import { Public } from "./auth/decorators/public.decorator.js";
import { AppService } from "./app.service.js";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ResponseMessage("Service is healthy")
  getHello(): string {
    return this.appService.getHello();
  }
}
