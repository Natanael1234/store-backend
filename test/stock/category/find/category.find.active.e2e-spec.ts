import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConfigs } from '../../../../src/modules/stock/category/configs/category/category.configs';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../src/test/category/test-category-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');

describe('CategoryController (e2e) - get /categories (active)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
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
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
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

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  async function getInactiveCategories() {
    return objectToJSON(
      await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .where(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, {
          isActiveCategory: false,
        })
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  async function getActiveCategories() {
    return objectToJSON(
      await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .where(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, {
          isActiveCategory: true,
        })
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  async function getAllCategories() {
    return objectToJSON(
      await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  describe('active = "all"', () => {
    it('should find active and inactive categories when active = "all" and user is root', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const categories = await getAllCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 3,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: categories,
      });
    });

    it('should find active and inactive categories when active = "all" and user is admin', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const categories = await getAllCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 3,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: categories,
      });
    });

    it('should reject when active = "all" and user is basic user', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: CategoryMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when active = "all" and user is not authenticated', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: CategoryMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('active = "active"', () => {
    it('should find active categories when active = "active" and user is root', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const categories = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: categories,
      });
    });

    it('should find active categories when active = "active" and user is admin', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find active categories when active = "active" and user is basic user', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find active categories when active = "active" and user is not authenticated', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });

  describe('active = "inactive"', () => {
    it('should find inactive categories when active = "inactive" and user is root', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const categories = await getInactiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: categories,
      });
    });

    it('should find inactive categories when active = "inactive" and user is admin', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const categories = await getInactiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: categories,
      });
    });

    it('should reject when active = "inactive" and user is basic user', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: CategoryMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when active = "inactive" and user is not authenticated', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: CategoryMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('active = "null"', () => {
    it('should find active categories when active = null and user is root', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: null }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find active categories when active = null and user is admin', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: null }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find active categories when active = null and user is basic user', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: null }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find active categories when active = null and user is not authenticated', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: null }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });

  describe('active = "undefined"', () => {
    it('should find active categories when active = undefined and user is root', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find active categories when active = undefined and user is admin', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: undefined }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find active categories when active = undefined and user is basic user', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: undefined }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should find active categories when active = undefined and user is not authenticated', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
        { name: 'Category 3', active: false },
      );
      const regs = await getActiveCategories();
      const response = await testGetMin(
        app,
        '/categories',
        { query: JSON.stringify({ active: undefined }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });

  describe('invalid active', () => {
    it('should reject when active is number', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/categories',
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
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/categories',
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
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/categories',
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
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/categories',
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
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: false },
        { name: 'Category 2', active: true },
      );
      const response = await testGetMin(
        app,
        '/categories',
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
