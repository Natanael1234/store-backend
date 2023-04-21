import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandEntity } from './models/brand/brand.entity';
import { ProductEntity } from './models/product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, ProductEntity])],
})
export class StockModule {}
