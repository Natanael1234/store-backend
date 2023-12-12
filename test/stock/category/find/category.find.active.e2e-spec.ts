import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConfigs } from '../../../../src/modules/stock/category/configs/category/category.configs';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
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

  it('should retrieve active and inactive categories when active = "all"', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
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
      results: objectToJSON(regs),
    });
  });

  it('should retrieve inactive categories when active = "inactive"', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, { active: false })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
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
      results: objectToJSON(regs),
    });
  });

  it('should retrieve active categories when active = "active"', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
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
      results: objectToJSON(regs),
    });
  });

  it('should retrieve active and inactive categories when user is root', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
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
      results: objectToJSON(regs),
    });
  });

  it('should retrieve active and inactive categories when user is admin', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
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
      results: objectToJSON(regs),
    });
  });

  it('should retrieve active and inactive categories when user is basic user', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ active: ActiveFilter.ALL }) },
      userToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should retrieve active and inactive categories when user is null', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ active: ActiveFilter.ALL }) },
      null,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should retrieve active categories when active = null ', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
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
      results: objectToJSON(regs),
    });
  });

  it('should filter when active = undefined', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
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
      results: objectToJSON(regs),
    });
  });

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
