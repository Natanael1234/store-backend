import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { JWTConfigs } from '../modules/authentication/configs/jwt.configs';
import { AuthenticationController } from '../modules/authentication/controllers/auth/authentication.controller';
import { JwtAuthenticationGuard } from '../modules/authentication/guards/jwt/jwt-auth.guard';
import { RefreshToken } from '../modules/authentication/models/refresh-token.entity';
import { RefreshTokenRepository } from '../modules/authentication/repositories/refresh-token.repository';
import { AuthenticationService } from '../modules/authentication/services/authentication/authentication.service';
import { TokenService } from '../modules/authentication/services/token/token.service';
import { JwtStrategy } from '../modules/authentication/strategies/jwt/jwt.strategy';
import { LocalStrategy } from '../modules/authentication/strategies/local/local.strategy';
import { BrandController } from '../modules/stock/brand/controllers/brand/brand.controller';
import { Brand } from '../modules/stock/brand/models/brand/brand.entity';
import { BrandService } from '../modules/stock/brand/services/brand/brand.service';
import { CategoryController } from '../modules/stock/category/controllers/category/category.controller';
import { Category } from '../modules/stock/category/models/category/category.entity';
import { CategoryRepository } from '../modules/stock/category/repositories/category.repository';
import { CategoryService } from '../modules/stock/category/services/category/category.service';
import { ProductImageController } from '../modules/stock/product-image/controller/product-image/product-image.controller';
import { ProductImage } from '../modules/stock/product-image/models/product-image/product-image.entity';
import { ProductImageService } from '../modules/stock/product-image/services/product-image/product-image.service';
import { ProductController } from '../modules/stock/product/controllers/product/product.controller';
import { Product } from '../modules/stock/product/models/product/product.entity';
import { ProductService } from '../modules/stock/product/services/product/product.service';
import { CloudStorageModule } from '../modules/system/cloud-storage/cloud-storage.module';
import { EncryptionService } from '../modules/system/encryption/services/encryption/encryption.service';
import { ImageService } from '../modules/system/image/services/image-file/image-file.service';
import { UserController } from '../modules/user/controllers/user/user.controller';
import { RolesGuard } from '../modules/user/guards/roles/roles.guard';
import { User } from '../modules/user/models/user/user.entity';
import { UserService } from '../modules/user/services/user/user.service';
import { sqlitDatabaseOptions } from './sqlite-database-options';

export async function getTestingModule(
  additionalMetadata?: ModuleMetadata,
): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forFeature([
        User,
        RefreshToken,
        Product,
        Brand,
        Category,
        ProductImage,
      ]),
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRoot(sqlitDatabaseOptions),
      PassportModule,
      JwtModule.register({
        secret: JWTConfigs.ACCESS_TOKEN_SECRET,
        signOptions: { expiresIn: JWTConfigs.ACCESS_TOKEN_EXPIRATION },
      }),
      MulterModule.register({}),
      CloudStorageModule.forRoot({
        endPoint: 'test.com',
        port: 9000,
        useSSL: false,
        accessKey: 'access_key',
        secretKey: 'secret_key',
        bucketName: 'test-store-bucket',
      }),

      // ImageModule,
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
      ProductImageService,
      ImageService,
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
      ProductImageController,
      // ImageController,
      ...(additionalMetadata?.controllers || []),
    ],
  }).compile();
}
