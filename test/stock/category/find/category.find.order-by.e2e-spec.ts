import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConfigs } from '../../../../src/modules/stock/category/configs/category/category.configs';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryOrder } from '../../../../src/modules/stock/category/enums/category-order/category-order.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../src/test/category/test-category-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('CategoryController (e2e) - find /categories (orderBy)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let categoryRepo: CategoryRepository;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    categoryRepo = moduleFixture.get<CategoryRepository>(CategoryRepository);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
  });

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  it('should order by ["name_asc", "active_asc"]', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
    });
  });

  it('should order by ["name_asc", "active_desc"]', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .skip(0)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_DESC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_DESC],
      results: objectToJSON(regs),
    });
  });

  it('should order by ["name_desc", "active_asc"]', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.DESC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
    });
  });

  it('should order by ["name_desc", "active_desc"]', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.DESC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_DESC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_DESC],
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is null', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: null, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is undefined', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          orderBy: undefined,
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is string', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: '[]', active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains repeated column', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          orderBy: ['invadlid_asc'],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is number', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({ orderBy: undefined, active: ActiveFilter.ALL }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is number', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: 1, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is boolean', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: true, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is array', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: [], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is object', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: {}, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid string item', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          orderBy: ['invalid_asc'],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid number item', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: [1], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid boolean item', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: [true], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid array item', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: [[]], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid object item', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ orderBy: [{}], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });
});
