import { Module } from "@nestjs/common";
import { PageModule } from "../page/page.module.js";
import { AboutController } from "./about.controller.js";

@Module({
  imports: [PageModule],
  controllers: [AboutController],
})
export class AboutModule {}
