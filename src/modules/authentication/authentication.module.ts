import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CachingModule } from '../system/caching/caching.module';
import { EncryptionModule } from '../system/encryption/encryption.module';
import { UserModule } from '../user/user.module';
import { JWTConfigs } from './configs/jwt.config';
import { AuthenticationController } from './controllers/auth/authentication.controller';
import { JwtAuthenticationGuard } from './guards/jwt/jwt-auth.guard';
import { RefreshTokenEntity } from './models/refresh-token.entity';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { AuthenticationService } from './services/authentication/authentication.service';
import { TokenService } from './services/token/token.service';
import { JwtStrategy } from './strategies/jwt/jwt.strategy';
import { LocalStrategy } from './strategies/local/local.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: JWTConfigs.ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: JWTConfigs.ACCESS_TOKEN_EXPIRATION,
      },
    }),
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    UserModule,
    PassportModule,
    CachingModule,
    EncryptionModule,
  ],
  providers: [
    AuthenticationService,
    LocalStrategy,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthenticationGuard },
    RefreshTokenRepository,
    TokenService,
  ],
  exports: [AuthenticationService],
  controllers: [AuthenticationController],
})
export class AwuthenticationModule {}
