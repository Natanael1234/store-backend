import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  // @UseInterceptors(CacheInterceptor) // automatically cache the response
  // @CacheTTL(30) // sets the TTL to 30 seconds

  @Get('hello')
  // @SkipAuthentication()
  getHello(): string {
    return this.appService.getHello();
  }
}
