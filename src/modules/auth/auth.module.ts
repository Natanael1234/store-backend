import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth/auth.service';
import { LocalStrategy } from './strategies/local/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt/jwt.strategy';
import { AuthController } from './controllers/auth/auth.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt/jwt-auth.guard';
import { EncryptionModule } from '../system/encryption/encryption.module';
import { CachingModule } from '../system/caching/caching.module';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { TokenService } from './services/token/token.service';
import { RefreshTokenEntity } from './models/refresh-token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWTConfigs } from './configs/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    UserModule,
    PassportModule,
    CachingModule,
    JwtModule.register({
      secret: JWTConfigs.ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: JWTConfigs.ACCESS_TOKEN_EXPIRATION,
      },
    }),
    EncryptionModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    RefreshTokenRepository,
    TokenService,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
