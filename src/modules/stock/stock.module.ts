import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { BrandController } from './controllers/brand/brand.controller';
import { BulkController } from './controllers/bulk/bulk.controller';
import { CategoryController } from './controllers/category/category.controller';
import { ProductController } from './controllers/product/product.controller';
import { BrandEntity } from './models/brand/brand.entity';
import { CategoryEntity } from './models/category/category.entity';
import { ProductEntity } from './models/product/product.entity';
import { CategoryRepository } from './repositories/category.repository';
import { BrandService } from './services/brand/brand.service';
import { BulkService } from './services/bulk/bulk.service';
import { CategoryService } from './services/category/category.service';
import { ProductService } from './services/product/product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrandEntity, ProductEntity, CategoryEntity]),
  ],
  controllers: [
    ProductController,
    BrandController,
    BulkController,
    CategoryController,
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
  ],
  exports: [BrandService, ProductService, BulkService],
})
export class StockModule {}
