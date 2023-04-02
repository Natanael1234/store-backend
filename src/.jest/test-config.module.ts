import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserEntity } from '../modules/user/models/user/user.entity';
import { UserService } from '../modules/user/services/user/user.service';
import { EncryptionService } from '../modules/system/encryption/services/encryption/encryption.service';
import { sqlitDatabaseOptions } from './sqlite-database-options';
import { RefreshTokenEntity } from '../modules/auth/models/refresh-token.entity';
import { ModuleMetadata } from '@nestjs/common';
import { RefreshTokenRepository } from '../modules/auth/repositories/refresh-token.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JWTConfigs } from '../modules/auth/configs/jwt.config';
import { LocalStrategy } from '../modules/auth/strategies/local/local.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../modules/auth/guards/jwt/jwt-auth.guard';
import { AuthService } from '../modules/auth/services/auth/auth.service';
import { TokenService } from '../modules/auth/services/token/token.service';
import { JwtStrategy } from '../modules/auth/strategies/jwt/jwt.strategy';
import { CachingService } from '../modules/system/caching/services/caching.service';
import { CacheModule } from '@nestjs/common';

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
      { provide: APP_GUARD, useClass: JwtAuthGuard },
      LocalStrategy,
      JwtStrategy,
      UserService,
      EncryptionService,
      RefreshTokenRepository,
      TokenService,
      AuthService,
      ...(additionalMetadata?.providers || []),
      CachingService, // TODO: verificar se não dará conflito com o de produção
    ],
    controllers: [...(additionalMetadata?.controllers || [])],
  }).compile();
}
