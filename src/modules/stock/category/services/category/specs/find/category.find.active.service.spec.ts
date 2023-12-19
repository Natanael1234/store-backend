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
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const ActiveMessage = new BoolMessage('active');

describe('CategoryService.find', () => {
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

  it('should retrieve active and inactive categories when active = "all"', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({ active: ActiveFilter.ALL });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: categories,
    });
  });

  it('should retrieve inactive categories when active = "inactive"', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const categories = await categoryRepo
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
      .getMany();
    const response = await categoryService.find({
      active: ActiveFilter.INACTIVE,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: categories,
    });
  });

  it('should retrieve active categories when active = "active"', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const categories = await categoryRepo
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
      .getMany();
    const response = await categoryService.find({
      active: ActiveFilter.ACTIVE,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: categories,
    });
  });

  it('should retrieve active categories when active = null ', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const categories = await categoryRepo
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
      .getMany();
    const response = await categoryService.find({ active: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: categories,
    });
  });

  it('should filter when active = undefined', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    );
    const categories = await categoryRepo
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
      .getMany();
    const response = await categoryService.find({ active: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: categories,
    });
  });

  it('should reject when active is number', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
    );
    const fn = () =>
      categoryService.find({ active: 1 as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is boolean', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
    );
    const fn = () =>
      categoryService.find({ active: true as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is array', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
    );
    const fn = () =>
      categoryService.find({ active: [] as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is object', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
    );
    const fn = () =>
      categoryService.find({ active: {} as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is invalid string', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: true },
    );
    const fn = () =>
      categoryService.find({
        active: 'invalid' as unknown as ActiveFilter,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
