import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConfigs } from '../../../../src/modules/stock/brand/configs/brand/brand.configs';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../src/modules/system/messages/text-old/text.messages.enum';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - get /brands (textQuery)', () => {
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

  it('should match one result when filtering by text', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_ID_EQUALS_TO, { brandId: brandId1 })
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: 'anD 1' }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: 'and 1',
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should match all results when filtering by text', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: '  r   nd' }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: 'r nd',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should match no results when filtering by text', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: '  not  found ' }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: 'not found',
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: [],
    });
  });

  it('should not filter by text when textQuery is empty string', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: '' }) },
      rootToken,
      HttpStatus.OK,
    );

    expect(response).toEqual({
      textQuery: '',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should not filter by text when textQuery is string made of spaces', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: '     ' }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: '',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should not filter by text when textQuery is null', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: null }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should not filter by text when textQuery is undefined', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: undefined }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should reject when textQuery is number', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: 1 }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { textQuery: TextMessageOLD.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when textQuery is boolean', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: true }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { textQuery: TextMessageOLD.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when textQuery is []', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: [] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { textQuery: TextMessageOLD.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when textQuery is object', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: true },
    );
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ textQuery: {} }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { textQuery: TextMessageOLD.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
