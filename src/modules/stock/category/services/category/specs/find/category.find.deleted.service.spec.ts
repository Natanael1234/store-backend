import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const DeletedMessage = new BoolMessage('deleted');

describe('CategoryService.find (deleted)', () => {
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

  it('should retrieve deleted and non deleted categories when deleted = "all"', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
      { name: 'Category 3', active: true },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({ deleted: DeletedFilter.ALL });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve deleted categories when deleted = "deleted"', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
      { name: 'Category 3', active: true },
    );
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_DELETED_AT_IS_NOT_NULL)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({
      deleted: DeletedFilter.DELETED,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve not deleted categories when deleted = "not_deleted"', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
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
    const response = await categoryService.find({
      deleted: DeletedFilter.NOT_DELETED,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve not deleted categories when deleted = null', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
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
    const response = await categoryService.find({ deleted: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve not deleted categories when deleted = undefined', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
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
    const response = await categoryService.find({ deleted: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when deleted is invalid boolean', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.find({ deleted: true as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deleted is invalid array', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.find({ deleted: [] as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deleted is invalid object', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.find({ deleted: {} as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deleted is invalid string', async () => {
    const categoriesIds = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.find({ deleted: '1' as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
