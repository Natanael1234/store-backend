import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';

import { BrandEntity } from '../src/modules/stock/models/brand/brand.entity';
import { ProductEntity } from '../src/modules/stock/models/product/product.entity';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import {
  TestRequestFunction,
  getHTTPDeleteMethod,
  getHTTPGetMethod,
  getHTTPPatchMethod,
  getHTTPPostMethod,
} from './test-request-utils';

describe('StockController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  let brandRepo: Repository<BrandEntity>;
  let productRepo: Repository<ProductEntity>;

  let httpGet: TestRequestFunction;
  let httpPost: TestRequestFunction;
  let httpPatch: TestRequestFunction;
  let httpDelete: TestRequestFunction;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();

    httpGet = getHTTPGetMethod(app);
    httpPost = getHTTPPostMethod(app);
    httpPatch = getHTTPPatchMethod(app);
    httpDelete = getHTTPDeleteMethod(app);

    // app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );

    brandRepo = app.get<Repository<BrandEntity>>(
      getRepositoryToken(BrandEntity),
    );
    productRepo = app.get<Repository<ProductEntity>>(
      getRepositoryToken(ProductEntity),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  describe('/stock/products/bulk (POST)', () => {
    it.skip('should bulk create products and brands', async () => {});
  });
});
