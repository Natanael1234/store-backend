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
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import { testInsertBrands } from '../../../../src/test/brand/test-brand-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');

describe('BrandController (e2e) - get /brands (active)', () => {
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

  async function getActiveBrands() {
    return objectToJSON(
      await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { isActiveBrand: true })
        .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  async function getInactiveBrands() {
    return objectToJSON(
      await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { isActiveBrand: false })
        .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  async function getAllBrands() {
    return objectToJSON(
      await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  describe('active = "all"', () => {
    it('should find active and inactive brands when active = "all" and user is root', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const brands = await getAllBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
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

    it('should find active and inactive brands when active = "all" and user is admin', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const brands = await getAllBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
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

    it('should reject when active = "all" and user is basic user', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
      ]);
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: BrandMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when active = "all" and user is not authenticated', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
      ]);
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: BrandMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('active = "active"', () => {
    it('should find active brands when active = "active" and user is root', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const brands = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
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

    it('should find active brands when active = "active" and user is admin', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
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

    it('should find active brands when active = "active" and user is basic user', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
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

    it('should find active brands when active = "active" and user is not authenticated', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
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

  describe('active = "inactive"', () => {
    it('should find inactive brands when active = "inactive" and user is root', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const brands = await getInactiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
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

    it('should find inactive brands when active = "inactive" and user is admin', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const brands = await getInactiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
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

    it('should reject when active = "inactive" and user is basic user', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
      ]);
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: BrandMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when active = "inactive" and user is not authenticated', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
      ]);
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: BrandMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('active = "null"', () => {
    it('should find active brands when active = null and user is root', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: null }) },
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

    it('should find active brands when active = null and user is admin', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: null }) },
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

    it('should find active brands when active = null and user is basic user', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: null }) },
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

    it('should find active brands when active = null and user is not authenticated', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: null }) },
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

  describe('active = "undefined"', () => {
    it('should find active brands when active = undefined and user is root', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: undefined }) },
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

    it('should find active brands when active = undefined and user is admin', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: undefined }) },
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

    it('should find active brands when active = undefined and user is basic user', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: undefined }) },
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

    it('should find active brands when active = undefined and user is not authenticated', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
        { name: 'Brand 3', active: false },
      ]);
      const regs = await getActiveBrands();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: undefined }) },
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

  describe('invalid active', () => {
    it('should reject when active is number', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
      ]);
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: 1 }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when active is boolean', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
      ]);
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: true }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when active is array', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
      ]);
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: [] }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when active is object', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
      ]);
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: {} }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when active is invalid string', async () => {
      const brandsIds = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: false },
        { name: 'Brand 2', active: true },
      ]);
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ active: 'invalid' }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });
  });
});
