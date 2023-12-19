import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../../../system/messages/text-old/text.messages.enum';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService.find (textQuery)', () => {
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

  it('should match one result when filtering by text', async () => {
    const [catgoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_ID_EQUALS_TO, {
        categoryId: catgoryId1,
      })
      .getMany();
    const response = await categoryService.find({ textQuery: 'orY 1' });
    expect(response).toEqual({
      textQuery: 'ory 1',
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should match all results when filtering by text', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
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
    const response = await categoryService.find({ textQuery: ' aT   ory' });
    expect(response).toEqual({
      textQuery: 'at ory',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should match no results when filtering by text', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
    );
    const response = await categoryService.find({ textQuery: '  not  found ' });
    expect(response).toEqual({
      textQuery: 'not found',
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: [],
    });
  });

  it('should not filter by text when textQuery is empty string', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
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
    const response = await categoryService.find({ textQuery: '' });
    expect(response).toEqual({
      textQuery: '',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should not filter by text when textQuery is string made of spaces', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
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
    const response = await categoryService.find({ textQuery: '     ' });
    expect(response).toEqual({
      textQuery: '',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should not filter by text when textQuery is null', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
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
    const response = await categoryService.find({ textQuery: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should not filter by text when textQuery is undefined', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
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
    const response = await categoryService.find({ textQuery: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when textQuery is number', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
    );
    const fn = () =>
      categoryService.find({ textQuery: 1 as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { textQuery: TextMessageOLD.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when textQuery is boolean', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
    );
    const fn = () =>
      categoryService.find({ textQuery: true as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { textQuery: TextMessageOLD.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when textQuery is []', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
    );
    const fn = () =>
      categoryService.find({ textQuery: [] as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { textQuery: TextMessageOLD.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when textQuery is object', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
    );
    const fn = () =>
      categoryService.find({ textQuery: {} as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { textQuery: TextMessageOLD.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
