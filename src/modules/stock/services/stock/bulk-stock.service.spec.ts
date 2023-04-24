import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { BrandEntity } from '../../models/brand/brand.entity';
import { ProductEntity } from '../../models/product/product.entity';
import { StockService } from './stock.service';

describe('StockService', () => {
  let stockService: StockService;
  let module: TestingModule;
  let brandRepo: Repository<BrandEntity>;
  let productRepo: Repository<ProductEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<BrandEntity>>(
      getRepositoryToken(BrandEntity),
    );
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

  describe('bulk create', () => {
    it.skip('should bulk create products and brands', async () => {});
  });
});
