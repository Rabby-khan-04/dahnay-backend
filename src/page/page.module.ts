import { Module } from "@nestjs/common";
import { PageController } from "./page.controller.js";
import { PageService } from "./page.service.js";

@Module({
  controllers: [PageController],
  providers: [PageService],
})
export class PageModule {}
