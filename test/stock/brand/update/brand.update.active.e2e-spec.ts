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
  TestBrandInsertParams,
  testInsertBrands,
  testValidateBrand,
  testValidateBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');

describe('BrandController (e2e) - patch /brands/:brandId (active)', () => {
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

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  it('should accept when active is true', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3' },
    );
    const updatedBrand = await testPatchMin(
      app,
      `/brands/${brandId1}`,
      { active: true },
      rootToken,
      HttpStatus.OK,
    );
    const expectedResults = [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true },
      { id: brandId3, name: 'Brand 3', active: false },
    ];
    testValidateBrand(updatedBrand, expectedResults[0]);
    const brandsAfter = await getBrands();
    testValidateBrands(brandsAfter, expectedResults);
  });

  it('should accept when active is false', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3' },
    );
    const updatedBrand = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: undefined, active: false },
      rootToken,
      HttpStatus.OK,
    );
    const expectedResults = [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
      { id: brandId3, name: 'Brand 3', active: false },
    ];
    testValidateBrand(updatedBrand, expectedResults[1]);
    const brandsAfter = await getBrands();
    testValidateBrands(brandsAfter, expectedResults);
  });

  it('should accept when active is undefined', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    );
    const updatedBrand = await testPatchMin(
      app,
      `/brands/${brandId1}`,
      { name: 'Brand 1b', active: undefined },
      rootToken,
      HttpStatus.OK,
    );
    const expectedResults = [
      { id: brandId1, name: 'Brand 1b', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
      { id: brandId3, name: 'Brand 3', active: false },
    ];
    testValidateBrand(updatedBrand, expectedResults[0]);
    const brandsAfter = await getBrands();
    testValidateBrands(brandsAfter, expectedResults);
  });

  it('should reject when active is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: 'Brand 1', active: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when active is number', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: 'Brand 1', active: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when active is string', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: 'Brand 1', active: 'true' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when active is array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: 'Brand 1', active: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when active is object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: 'Brand 1', active: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });
});
