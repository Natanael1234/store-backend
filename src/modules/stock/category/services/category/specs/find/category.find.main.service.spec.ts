import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../../../system/messages/text-old/text.messages.enum';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryOrder } from '../../../../enums/category-order/category-order.enum';
import { Category } from '../../../../models/category/category.entity';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

describe('CategoryService.find (main)', () => {
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

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

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
    const response = await categoryService.find({
      textQuery: 'ory  1  ',
      active: ActiveFilter.INACTIVE,
      deleted: DeletedFilter.DELETED,
      orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
      page: 1,
      pageSize: 2,
    });
    expect(response).toEqual({
      textQuery: 'ory 1',
      count: 3,
      page: 1,
      pageSize: 2,
      orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
      results: regs,
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

    const response = await categoryService.find({});

    expect(response).toEqual({
      textQuery: undefined,
      count: 13,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
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

    const response = await categoryService.find({});

    expect(response).toEqual({
      textQuery: undefined,
      count: 5,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: categories,
    });
  });

  it('should return empty list', async () => {
    const categoriesBefore = await categoryRepo.find();
    const response = await categoryService.find();
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
    const fn = () =>
      categoryService.find({
        active: 'invalid_asc' as unknown as ActiveFilter,
        deleted: 'invalid_desc' as unknown as DeletedFilter,
        textQuery: true as unknown as string,
        page: '1' as unknown as number,
        pageSize: true as unknown as number,
        orderBy: true as unknown as CategoryOrder[],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          active: ActiveMessage.INVALID,
          deleted: DeletedMessage.INVALID,
          textQuery: TextMessageOLD.INVALID,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should use default filter values when findDTO is null', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
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
    const response = await categoryService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default filter values when findDTO is undefined', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
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
    const response = await categoryService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });
});
