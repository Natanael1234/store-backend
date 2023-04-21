import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandEntity } from './models/brand/brand.entity';
import { ProductEntity } from './models/product/product.entity';
import { StockService } from './services/stock/stock.service';

@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, ProductEntity])],
  providers: [StockService],
})
export class StockModule {}
