import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConfigs } from '../../../../src/modules/stock/brand/configs/brand/brand.configs';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../src/modules/system/messages/text/text.messages';
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

const { NAME_MAX_LENGTH, NAME_MIN_LENGTH } = BrandConfigs;

const NameMessage = new TextMessage('name', {
  minLength: NAME_MIN_LENGTH,
  maxLength: NAME_MAX_LENGTH,
});

describe('BrandController (e2e) - patch /brands/:brandId (name)', () => {
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

  it(`should accept when name has minimum allowed length`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const name = 'A'.repeat(NAME_MIN_LENGTH);
    const expectedResults = [
      { id: brandId1, name, active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ];
    const updatedBrand = await testPatchMin(
      app,
      `/brands/${brandId1}`,
      { name },
      rootToken,
      HttpStatus.OK,
    );
    testValidateBrand(updatedBrand, expectedResults[0]);
    const brandsAfter = await getBrands();
    testValidateBrands(brandsAfter, expectedResults);
  });

  it(`should accept when name has maximum allowed length`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const name = 'A'.repeat(NAME_MAX_LENGTH);
    const updatedBrand = await testPatchMin(
      app,
      `/brands/${brandId1}`,
      { name },
      rootToken,
      HttpStatus.OK,
    );
    const expectedResults = [
      { id: brandId1, name: name, active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ];
    testValidateBrand(updatedBrand, expectedResults[0]);
    const brandsAfter = await getBrands();
    testValidateBrands(brandsAfter, expectedResults);
  });

  it(`should accept when name is undefined`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const updatedBrand = await testPatchMin(
      app,
      `/brands/${brandId1}`,
      { name: undefined, active: false },
      rootToken,
      HttpStatus.OK,
    );
    const expectedResults = [
      { id: brandId1, name: 'Brand 1', active: false },
      { id: brandId2, name: 'Brand 2', active: false },
    ];
    testValidateBrand(updatedBrand, expectedResults[0]);
    const brandsAfter = await getBrands();
    expect(brandsBefore).toHaveLength(expectedResults.length);
    testValidateBrands(brandsAfter, expectedResults);
  });

  it('should reject when name is too short', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: 'x'.repeat(NAME_MIN_LENGTH - 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MIN_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when name is too long', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: 'x'.repeat(NAME_MAX_LENGTH + 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when name is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when name is number', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: 2323232 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when name is boolean', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when name is array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it('should reject when name is object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/${brandId2}`,
      { name: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });
});
