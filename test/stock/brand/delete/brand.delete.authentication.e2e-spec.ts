import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
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
  let moduleFixture: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
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
