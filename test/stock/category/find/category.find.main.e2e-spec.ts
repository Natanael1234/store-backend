import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConfigs } from '../../../../src/modules/stock/category/configs/category/category.configs';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryOrder } from '../../../../src/modules/stock/category/enums/category-order/category-order.enum';
import { Category } from '../../../../src/modules/stock/category/models/category/category.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../src/modules/system/messages/text-old/text.messages.enum';
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
const DeletedMessage = new BoolMessage('deleted');

describe('CategoryController (e2e) - find /categories (main)', () => {
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

  it('should find categories with filtering parameters', async () => {
    const [
      categoryId1,
      categoryId2,
      categoryId3,
      categoryId4,
      categoryId5,
      categoryId6,
      categoryId7,
    ] = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 1', active: true },
      { name: 'Category 1', active: false, deletedAt: new Date() },
      { name: 'Category 1', active: true, deletedAt: new Date() },

      { name: 'Category 1 b', active: false },
      { name: 'Category 1 b', active: true },
      { name: 'Category 1 b', active: false, deletedAt: new Date() },
      { name: 'Category 1 b', active: true, deletedAt: new Date() },

      { name: 'Category 1 c', active: false },
      { name: 'Category 1 c', active: true },
      { name: 'Category 1 c', active: false, deletedAt: new Date() },
      { name: 'Category 1 c', active: true, deletedAt: new Date() },

      { name: 'Category 2', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 2', active: false, deletedAt: new Date() },
      { name: 'Category 2', active: true, deletedAt: new Date() },

      { name: 'Category 3', active: false },
      { name: 'Category 3', active: true },
      { name: 'Category 3', active: false, deletedAt: new Date() },
      { name: 'Category 3', active: true, deletedAt: new Date() },
    );

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_ID_IN, {
        categoryIds: [categoryId3, categoryId7],
      })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .withDeleted()
      .getMany();
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          textQuery: 'ory  1  ',
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.DELETED,
          orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
          page: 1,
          pageSize: 2,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: 'ory 1',
      count: 3,
      page: 1,
      pageSize: 2,
      orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
    });
  });

  it('should find categories without parameters and pagination dtos', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category  1', active: true },
      { name: 'Category  2', active: true },
      { name: 'Category  3', active: false },
      { name: 'Category  4', active: true },
      { name: 'Category  5', active: true, deletedAt: new Date() },
      { name: 'Category  6', active: true },
      { name: 'Category  7', active: true },
      { name: 'Category  8', active: true },
      { name: 'Category  9', active: true },
      { name: 'Category 10', active: true },
      { name: 'Category 11', active: true },
      { name: 'Category 12', active: true },
      { name: 'Category 13', active: true },
      { name: 'Category 14', active: true },
      { name: 'Category 15', active: true },
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .skip(0)
      .getMany();

    const response = await testGetMin(
      app,
      '/categories',
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );

    expect(response).toEqual({
      textQuery: undefined,
      count: 13,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should return parents', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const categories = await categoryRepo.find({
      where: { active: true },
      skip: 0,
      take: PaginationConfigs.DEFAULT_PAGE_SIZE,
      order: { name: SortConstants.ASC, active: SortConstants.ASC },
      relations: { parent: true },
    });

    const response = await testGetMin(
      app,
      '/categories',
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );

    expect(response).toEqual({
      textQuery: undefined,
      count: 5,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(categories),
    });
  });

  it('should return empty list', async () => {
    const categoriesBefore = await categoryRepo.find();
    const response = await testGetMin(
      app,
      '/categories',
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
    expect(await categoryRepo.find()).toHaveLength(0);
    expect(categoriesBefore).toHaveLength(0);
    expect(response.results).toHaveLength(0);
    expect(response.count).toEqual(0);
    expect(response.page).toEqual(PaginationConfigs.DEFAULT_PAGE);
    expect(response.pageSize).toEqual(PaginationConfigs.DEFAULT_PAGE_SIZE);
  });

  it('should reject when data contains multiple errors', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category  1', active: true },
      { name: 'Category  2', active: true },
    );
    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          active: 'invalid_asc',
          deleted: 'invalid_desc',
          textQuery: true,
          page: '1',
          pageSize: true,
          orderBy: true,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: {
        active: ActiveMessage.INVALID,
        deleted: DeletedMessage.INVALID,
        textQuery: TextMessageOLD.INVALID,
      },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
