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
import { DeletedFilter } from '../../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
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

const DeletedMessage = new BoolMessage('deleted');

describe('BrandController (e2e) - find /brands (deleted)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();

    // app.setGlobalPrefix('api');
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    const tokens = await testBuildAuthenticationScenario(module);
    userToken = tokens.userToken;
    adminToken = tokens.adminToken;
    rootToken = tokens.rootToken;
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

  it('should retrieve deleted and non deleted brands when deleted = "all"', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
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

  it('should retrieve deleted brands when deleted = "deleted"', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_DELETED_AT_IS_NOT_NULL)
      .withDeleted()
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should retrieve not deleted brands when deleted = "not_deleted"', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should retrieve both deleted and not deleted brands when user is root', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
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

  it('should retrieve both deleted and not deleted brands when user is admin', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      adminToken,
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

  it('should retrieve only deleted brands when user is basic user', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      userToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should retrieve only not deleted brands when user is not authenticated', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      null,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should retrieve not deleted brands when deleted = null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: null }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should retrieve not deleted brands when deleted = undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: undefined }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should reject when deleted is invalid boolean', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: true }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when deleted is invalid array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: [] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when deleted is invalid object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: {} }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when deleted is invalid string', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ deleted: '1' }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
