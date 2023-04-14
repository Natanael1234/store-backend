import { CacheModule, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { JWTConfigs } from '../modules/authentication/configs/jwt.config';
import { AuthenticationController } from '../modules/authentication/controllers/auth/authentication.controller';
import { JwtAuthenticationGuard } from '../modules/authentication/guards/jwt/jwt-auth.guard';
import { RefreshTokenEntity } from '../modules/authentication/models/refresh-token.entity';
import { RefreshTokenRepository } from '../modules/authentication/repositories/refresh-token.repository';
import { AuthenticationService } from '../modules/authentication/services/authentication/authentication.service';
import { TokenService } from '../modules/authentication/services/token/token.service';
import { JwtStrategy } from '../modules/authentication/strategies/jwt/jwt.strategy';
import { LocalStrategy } from '../modules/authentication/strategies/local/local.strategy';
import { CachingService } from '../modules/system/caching/services/caching.service';
import { EncryptionService } from '../modules/system/encryption/services/encryption/encryption.service';
import { UserController } from '../modules/user/controllers/user.controller';
import { UserEntity } from '../modules/user/models/user/user.entity';
import { UserService } from '../modules/user/services/user/user.service';
import { sqlitDatabaseOptions } from './sqlite-database-options';

export async function getTestingModule(
  additionalMetadata?: ModuleMetadata,
): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRoot(sqlitDatabaseOptions),
      PassportModule,
      JwtModule.register({
        secret: JWTConfigs.ACCESS_TOKEN_SECRET,
        signOptions: {
          expiresIn: JWTConfigs.ACCESS_TOKEN_EXPIRATION,
        },
      }),
      CacheModule.register(), // TODO: verificar se não dará conflito com o de produção
      ...(additionalMetadata?.imports || []),
    ],
    providers: [
      { provide: APP_GUARD, useClass: JwtAuthenticationGuard },
      LocalStrategy,
      JwtStrategy,
      UserService,
      EncryptionService,
      RefreshTokenRepository,
      TokenService,
      AuthenticationService,
      AppService,
      ...(additionalMetadata?.providers || []),
      CachingService, // TODO: verificar se não dará conflito com o de produção
    ],
    controllers: [
      UserController,
      AuthenticationController,
      AppController,
      ...(additionalMetadata?.controllers || []),
    ],
  }).compile();
}
