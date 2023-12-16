import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConfigs } from '../../../../src/modules/stock/brand/configs/brand/brand.configs';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../src/modules/stock/brand/messages/brand-messages/brand.messages.enum';
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

describe('BrandController (e2e) - get /brands (deleted)', () => {
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

  async function getDeletedBrands() {
    return objectToJSON(
      await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .withDeleted()
        .where(BrandConstants.BRAND_DELETED_AT_IS_NOT_NULL)
        .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
        .getMany(),
    );
  }

  async function getNotDeletedBrands() {
    return objectToJSON(
      await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
        .getMany(),
    );
  }

  async function getAllBrands() {
    return objectToJSON(
      await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .withDeleted()
        .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
        .getMany(),
    );
  }

  describe('deleted = "all"', () => {
    it('should find node deleted and deleted brands when deleted = "all" and user is root', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const brands = await getAllBrands();
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
        results: brands,
      });
    });

    it('should find node deleted and deleted brands when deleted = "all" and user is admin', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const brands = await getAllBrands();
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
        results: brands,
      });
    });

    it('should reject when deleted = "all" and user is basic user', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: BrandMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when deleted = "all" and user is not authenticated', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: BrandMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('deleted = "not_deleted"', () => {
    it('should find not deleted brands when deleted = "not_deleted" and user is root', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const brands = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: brands,
      });
    });

    it('should find not deleted brands when deleted = "not_deleted" and user is admin', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find not deleted brands when deleted = "not_deleted" and user is basic user', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find not deleted brands when deleted = "not_deleted" and user is not authenticated', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });

  describe('deleted = "deleted"', () => {
    it('should find deleted brands when deleted = "deleted" and user is root', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const brands = await getDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: brands,
      });
    });

    it('should find deleted brands when deleted = "deleted" and user is admin', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const brands = await getDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: brands,
      });
    });

    it('should reject when deleted = "deleted" and user is basic user', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: BrandMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when deleted = "deleted" and user is not authenticated', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: BrandMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('deleted = "null"', () => {
    it('should find not deleted brands when deleted = null and user is root', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: null }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find not deleted brands when deleted = null and user is admin', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: null }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find not deleted brands when deleted = null and user is basic user', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: null }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find not deleted brands when deleted = null and user is not authenticated', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: null }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });

  describe('deleted = "undefined"', () => {
    it('should find not deleted brands when deleted = undefined and user is root', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find not deleted brands when deleted = undefined and user is admin', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: undefined }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find not deleted brands when deleted = undefined and user is basic user', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: undefined }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find not deleted brands when deleted = undefined and user is not authenticated', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: true, deletedAt: new Date() },
      );
      const regs = await getNotDeletedBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: undefined }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });

  describe('invalid deleted', () => {
    it('should reject when deleted is number', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: 1 }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when deleted is boolean', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
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

    it('should reject when deleted is array', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
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

    it('should reject when deleted is object', async () => {
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
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
      const brandsIds = await insertBrands(
        { name: 'Brand 1', active: true, deletedAt: new Date() },
        { name: 'Brand 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ deleted: 'invalid' }) },
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
});
