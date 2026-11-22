import { Module } from "@nestjs/common";
import { SolutionController } from "./solution.controller.js";
import { SolutionService } from "./solution.service.js";

@Module({
  controllers: [SolutionController],
  providers: [SolutionService],
})
export class SolutionModule {}
