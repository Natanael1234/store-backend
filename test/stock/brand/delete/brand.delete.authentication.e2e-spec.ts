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
  testDeleteMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - delete /brands/:brandId (authentication)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;

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
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
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

  it('should not allow unauthenticaded brand', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: false });
    await testDeleteMin(
      app,
      `/brands/${brandId1}`,
      { query: '{}' },
      null,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should allow authenticaded brand', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: false });
    await testDeleteMin(
      app,
      `/brands/${brandId1}`,
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
  });
});
