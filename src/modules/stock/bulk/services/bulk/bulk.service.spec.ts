import { TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../.jest/test-config.module';
import { Brand } from '../../../brand/models/brand/brand.entity';
import { Product } from '../../../product/models/product/product.entity';
import { BulkService } from './bulk.service';

describe.skip('BulkService', () => {
  let bulkService: BulkService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    module = await getTestingModule();
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it.skip('should be defined', () => {
    expect(bulkService).toBeDefined();
  });

  describe('bulk create', () => {
    it.skip('should bulk create products and brands', async () => {});
  });
});
