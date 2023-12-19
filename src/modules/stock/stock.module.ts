import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { CloudStorageModule } from '../system/cloud-storage/cloud-storage.module';
import { MinioCongifs } from '../system/cloud-storage/configs/minio/minio.configs';
import { ImageModule } from '../system/image/image.module';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { BrandController } from './brand/controllers/brand/brand.controller';
import { Brand } from './brand/models/brand/brand.entity';
import { BrandService } from './brand/services/brand/brand.service';
import { BulkController } from './bulk/controllers/bulk/bulk.controller';
import { BulkService } from './bulk/services/bulk/bulk.service';
import { CategoryController } from './category/controllers/category/category.controller';
import { Category } from './category/models/category/category.entity';
import { CategoryRepository } from './category/repositories/category.repository';
import { CategoryService } from './category/services/category/category.service';
import { ProductImageController } from './product-image/controller/product-image/product-image.controller';
import { ProductImage } from './product-image/models/product-image/product-image.entity';
import { ProductImageService } from './product-image/services/product-image/product-image.service';
import { ProductController } from './product/controllers/product/product.controller';
import { Product } from './product/models/product/product.entity';
import { ProductService } from './product/services/product/product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, Product, ProductImage, Category]),
    CloudStorageModule.forRoot({
      endPoint: MinioCongifs.ENDPOINT,
      port: MinioCongifs.PORT,
      useSSL: MinioCongifs.USE_SSL,
      accessKey: MinioCongifs.ACCESS_KEY,
      secretKey: MinioCongifs.SECRET_KEY,
      bucketName: MinioCongifs.BUCKET_NAME,
    }),
    ImageModule,
  ],
  controllers: [
    ProductController,
    BrandController,
    BulkController,
    CategoryController,
    ProductImageController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    BrandService,
    ProductService,
    CategoryService,
    BulkService,
    TreeRepository,
    CategoryRepository,
    ProductImageService,
  ],
  exports: [BrandService, ProductService, BulkService],
})
export class StockModule {}
