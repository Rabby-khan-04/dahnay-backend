import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AuthModule } from "./auth/auth.module.js";
import { MediaModule } from "./media/media.module.js";
import { PageModule } from "./page/page.module.js";
import { SolutionModule } from "./solution/solution.module.js";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor.js";
import { envSchema } from "./config/env.validation.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    PrismaModule,
    AuthModule,
    MediaModule,
    SolutionModule,
    PageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
