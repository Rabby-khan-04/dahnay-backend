import { Module } from "@nestjs/common";
import { AboutController } from "./about.controller.js";
import { AboutPageService } from "./about.service.js";

@Module({
  controllers: [AboutController],
  providers: [AboutPageService],
})
export class AboutModule {}
