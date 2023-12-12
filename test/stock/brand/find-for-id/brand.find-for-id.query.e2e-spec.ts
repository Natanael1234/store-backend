import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../src/modules/stock/brand/messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
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

describe('BrandController (e2e) - get/:brandId /brands (query)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;

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

  it('should find brand using default query when query is null', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify(null) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand using default query when query is empty', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
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
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand and use query values when query is defined', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
      {
        query: JSON.stringify({
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.DELETED,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId4,
      name: 'Brand 4',
      active: false,
      deleted: true,
    });
  });

  it('should not find brand using default query when query is null string', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
      { query: 'null' },
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
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should not find brand using default query when query is null', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
      { query: null },
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
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should not find brand using default query when query is undefined', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
      { query: undefined },
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
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should not find brand using default query when query empty', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
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
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should not find brand when query values are defined', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
      {
        query: JSON.stringify({
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
        }),
      },
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
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should reject when query is number', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
      { query: JSON.stringify(1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: BrandMessage.DATA_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should reject when query is boolean', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
      { query: JSON.stringify(true) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: BrandMessage.DATA_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should reject when query is (invalid) string', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
      { query: JSON.stringify('{}') },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: BrandMessage.DATA_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should reject when query is array', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId4}`,
      { query: JSON.stringify([]) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: BrandMessage.DATA_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });
});
