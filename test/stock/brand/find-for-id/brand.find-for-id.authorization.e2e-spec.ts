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
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - post /brands (authorization)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let brandRepo: Repository<Brand>;
  let tokens: { rootToken: string; adminToken: string; userToken: string };

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    tokens = await testBuildAuthenticationScenario(moduleFixture);
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

  it('should not allow basic user', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: false });
    await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: `{}` },
      tokens.userToken,
      HttpStatus.OK,
    );
  });

  it('should not allow admin user', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: false });
    await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: `{}` },
      tokens.adminToken,
      HttpStatus.OK,
    );
  });

  it('should allow root user', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: false });
    await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: `{}` },
      tokens.rootToken,
      HttpStatus.OK,
    );
  });
});
