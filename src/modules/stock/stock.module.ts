import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { BrandController } from './controllers/brand/brand.controller';
import { BulkController } from './controllers/bulk/bulk.controller';
import { ProductController } from './controllers/product/product.controller';
import { BrandEntity } from './models/brand/brand.entity';
import { ProductEntity } from './models/product/product.entity';
import { BrandService } from './services/brand/brand.service';
import { BulkService } from './services/bulk/bulk.service';
import { ProductService } from './services/product/product.service';

@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, ProductEntity])],
  controllers: [ProductController, BrandController, BulkController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    BrandService,
    ProductService,
    BulkService,
  ],
  exports: [BrandService, ProductService, BulkService],
})
export class StockModule {}
