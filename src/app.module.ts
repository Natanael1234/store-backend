import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { StockModule } from './modules/stock/stock.module';
import { DatabaseModule } from './modules/system/database/database.module';
import { UserModule } from './modules/user/user.module';
import { ImageModule } from './modules/system/upload/image/image.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthenticationModule,
    UserModule,
    // CachingModule,
    DatabaseModule,
    StockModule,
    ImageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
