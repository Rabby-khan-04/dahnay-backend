import { Module } from "@nestjs/common";
import { PageModule } from "../page/page.module.js";
import { ContactController } from "./contact.controller.js";

@Module({
  imports: [PageModule],
  controllers: [ContactController],
})
export class ContactModule {}
