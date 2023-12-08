import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Brand } from '../../../src/modules/stock/brand/models/brand/brand.entity';
import { Product } from '../../../src/modules/stock/product/models/product/product.entity';

describe('BulkStockController (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;

  let brandRepo: Repository<Brand>;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();

    // app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );

    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await module.close();
  });

  describe('/stock/bulk (POST)', () => {
    it.skip('should bulk create products and brands', async () => {});
  });
});
