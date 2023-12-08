import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - get /brands:brandId (authentication)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let rootToken: string;
  let brandRepo: Repository<Brand>;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    await app.init();
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  it('should not allow unauthenticaded user', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: false });
    await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: `{}` },
      null,
      HttpStatus.OK,
    );
  });

  it('should allow authenticaded user', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: false });
    await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: `{}` },
      rootToken,
      HttpStatus.OK,
    );
  });
});
