import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import {
  testValidateBrand,
  testValidateBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');

describe('BrandController (e2e) - post /brands (active)', () => {
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
    await moduleFixture.close();
  });

  async function getBrands() {
    return brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .getMany();
  }

  it('should accept when active is true', async () => {
    const createdBrand = await testPostMin(
      app,
      '/brands',
      { active: true, name: 'Brand 1' },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [{ active: true, name: 'Brand 1' }];
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await getBrands();
    testValidateBrands(brands, expectedResults);
  });

  it('should accept when active is false', async () => {
    const createdBrand = await testPostMin(
      app,
      '/brands',
      { active: false, name: 'Brand 1' },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [{ active: false, name: 'Brand 1' }];
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await getBrands();
    testValidateBrands(brands, expectedResults);
  });

  it('should accept when active is undefined', async () => {
    const createdBrand = await testPostMin(
      app,
      '/brands',
      { active: undefined, name: 'Brand 1' },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [{ active: false, name: 'Brand 1' }];
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await getBrands();
    testValidateBrands(brands, expectedResults);
  });

  it('should reject when active is null', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when active is number', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when active is string', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: 'true' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when active is array', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when active is object', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });
});
