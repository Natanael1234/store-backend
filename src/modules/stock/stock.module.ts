import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../user/guards/roles/roles.guard';
import { StockController } from './controllers/stock.controller';
import { BrandEntity } from './models/brand/brand.entity';
import { ProductEntity } from './models/product/product.entity';
import { StockService } from './services/stock/stock.service';

@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, ProductEntity])],
  controllers: [StockController],
  providers: [
    StockService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [StockService],
})
export class StockModule {}
