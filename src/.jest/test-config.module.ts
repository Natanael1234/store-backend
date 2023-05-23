import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
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
import { BrandController } from '../modules/stock/controllers/brand/brand.controller';
import { CategoryController } from '../modules/stock/controllers/category/category.controller';
import { ProductController } from '../modules/stock/controllers/product/product.controller';
import { BrandEntity } from '../modules/stock/models/brand/brand.entity';
import { CategoryEntity } from '../modules/stock/models/category/category.entity';
import { ProductEntity } from '../modules/stock/models/product/product.entity';
import { CategoryRepository } from '../modules/stock/repositories/categoy.repository';
import { BrandService } from '../modules/stock/services/brand/brand.service';
import { CategoryService } from '../modules/stock/services/category/category.service';
import { ProductService } from '../modules/stock/services/product/product.service';
import { EncryptionService } from '../modules/system/encryption/services/encryption/encryption.service';
import { UserController } from '../modules/user/controllers/user.controller';
import { RolesGuard } from '../modules/user/guards/roles/roles.guard';
import { UserEntity } from '../modules/user/models/user/user.entity';
import { UserService } from '../modules/user/services/user/user.service';
import { sqlitDatabaseOptions } from './sqlite-database-options';

export async function getTestingModule(
  additionalMetadata?: ModuleMetadata,
): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forFeature([
        UserEntity,
        RefreshTokenEntity,
        ProductEntity,
        BrandEntity,
        CategoryEntity,
      ]),
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRoot(sqlitDatabaseOptions),
      PassportModule,
      JwtModule.register({
        secret: JWTConfigs.ACCESS_TOKEN_SECRET,
        signOptions: { expiresIn: JWTConfigs.ACCESS_TOKEN_EXPIRATION },
      }),
      // CacheModule.register(), // TODO: verificar se não dará conflito com o de produção
      ...(additionalMetadata?.imports || []),
    ],
    providers: [
      AppService,
      AuthenticationService,
      // CachingService, // TODO: verificar se não dará conflito com o de produção
      EncryptionService,
      JwtStrategy,
      LocalStrategy,
      RefreshTokenRepository,
      CategoryRepository,
      TokenService,
      UserService,
      ProductService,
      BrandService,
      CategoryService,
      TreeRepository,
      ...(additionalMetadata?.providers || []),
      { provide: APP_GUARD, useClass: JwtAuthenticationGuard },
      { provide: APP_GUARD, useClass: RolesGuard },
    ],
    controllers: [
      AppController,
      AuthenticationController,
      UserController,
      BrandController,
      ProductController,
      CategoryController,
      ...(additionalMetadata?.controllers || []),
    ],
  }).compile();
}
