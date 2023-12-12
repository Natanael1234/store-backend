import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../src/modules/stock/brand/messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
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
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveFilterMessage = new BoolMessage('active');

describe('BrandController (e2e) - get/:brandId /brands (query.active)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    const tokens = await testBuildAuthenticationScenario(module);
    userToken = tokens.userToken;
    adminToken = tokens.adminToken;
    rootToken = tokens.rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close();
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  it('should find brand when query.active filter is active', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand when query.active filter is inactive', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: false,
    });
  });

  it('should find brand when query.active filter is all', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: false,
    });
  });

  it('should find active brand when user is root', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find inactive brand when user is root', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: false,
    });
  });

  it('should find active brand when user is admin', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      adminToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find inactive brand when user is admin', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      adminToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: false,
    });
  });

  it('should find active brand when user is basic user', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      userToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find active brand when user is not authenticated', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      null,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand when query.active filter is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ active: null }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand when query.active filter is undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ active: undefined }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand when query.active filter not defined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should not find brand when query.active filter is active', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should not find brand when query.active filter is inactive', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );

    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should not find invactive brand when user is basic user', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      userToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should not find invactive brand when user is not authenticated', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      null,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should not find brand when query.active filter is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ active: null }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should not find brand when query.active filter is undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ active: undefined }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should not find brand when query.active filter is not defined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should reject when query.active filter is number', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({ active: 1 as unknown as ActiveFilter.ACTIVE }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should reject when query.active filter is boolean', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({
          active: true as unknown as ActiveFilter.ACTIVE,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should reject when query.active filter is invalid string', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );

    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({
          active: 'invalid' as unknown as ActiveFilter.ACTIVE,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should reject when query.active filter is array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({ active: [] as unknown as ActiveFilter.ACTIVE }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });

  it('should reject when query.active filter is object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({ active: {} as unknown as ActiveFilter.ACTIVE }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ]);
  });
});
