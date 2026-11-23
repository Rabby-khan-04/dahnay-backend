import { Module } from "@nestjs/common";
import { PageModule } from "../page/page.module.js";
import { HomeController } from "./home.controller.js";

@Module({
  imports: [PageModule],
  controllers: [HomeController],
})
export class HomeModule {}
