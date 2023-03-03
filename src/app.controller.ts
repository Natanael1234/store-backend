import {
  // CacheInterceptor,
  // CacheTTL,
  Controller,
  Get,
  // UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { SkipAuth } from './modules/auth/guards/skip-auth';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  // @UseInterceptors(CacheInterceptor) // automatically cache the response
  // @CacheTTL(30) // sets the TTL to 30 seconds
  // @SkipAuth()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
