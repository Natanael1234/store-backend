import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { ProductEntity } from '../../models/product/product.entity';
import { StockService } from './stock.service';

describe('StockService', () => {
  let stockService: StockService;
  let module: TestingModule;
  let productRepo: Repository<ProductEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    productRepo = module.get<Repository<ProductEntity>>(
      getRepositoryToken(ProductEntity),
    );
    stockService = module.get<StockService>(StockService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(stockService).toBeDefined();
  });
});
