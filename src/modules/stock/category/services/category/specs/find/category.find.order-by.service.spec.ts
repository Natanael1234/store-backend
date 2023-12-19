import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryOrder } from '../../../../enums/category-order/category-order.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService.find (orderBy)', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryService = module.get<CategoryService>(CategoryService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
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
    const response = await categoryService.find({
      orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
      results: regs,
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
    const response = await categoryService.find({
      orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_DESC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_DESC],
      results: regs,
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
    const response = await categoryService.find({
      orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      results: regs,
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
    const response = await categoryService.find({
      orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_DESC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_DESC],
      results: regs,
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
    const response = await categoryService.find({
      orderBy: null,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: undefined,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: '[]' as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: ['invadlid_asc'] as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: undefined,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: 1 as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: true as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: [] as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: {} as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: ['invalid_asc'] as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: [1] as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: [true] as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: [[]] as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await categoryService.find({
      orderBy: [{}] as unknown as CategoryOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });
});
