import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
  testValidateCategory,
} from '../../../../../../../test/category/test-category-utils';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { FindCategoryRequestDTO } from '../../../../dtos/find-category/find-category.request.dto';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService.findForId (findCategoryDto)', () => {
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

  async function insertCategories(
    ...categories: TestCategoryInsertParams[]
  ): Promise<string[]> {
    return testInsertCategories(categoryRepo, categories);
  }

  it('should find category using default findCategoryDto values when findCategoryDto is not defined', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await categoryService.findById(categoryId1);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category using default findCategoryDto values when findCategoryDto is null', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await categoryService.findById(categoryId1, null);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category using default findCategoryDto values when findCategoryDto is undefined', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await categoryService.findById(categoryId1, undefined);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category using default findCategoryDto values when findCategoryDto is defined but empty', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await categoryService.findById(categoryId1, {});
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category and use findCategoryDto values when findCategoryDto is defined', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await categoryService.findById(categoryId4, {
      active: ActiveFilter.INACTIVE,
      deleted: DeletedFilter.DELETED,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId4,
      name: 'Category 4',
      active: false,
      deleted: true,
    });
  });

  it('should not find category using default findCategoryDto values when findCategoryDto is not defined', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const fn = () => categoryService.findById(categoryId4);
    await expect(fn()).rejects.toThrow(NotFoundException);
    await expect(fn()).rejects.toThrow(CategoryMessage.NOT_FOUND);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should not find category using default findCategoryDto values when findCategoryDto is null', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const fn = () => categoryService.findById(categoryId4, null);
    await expect(fn()).rejects.toThrow(NotFoundException);
    await expect(fn()).rejects.toThrow(CategoryMessage.NOT_FOUND);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should not find category using default findCategoryDto values when findCategoryDto is undefined', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const fn = () => categoryService.findById(categoryId4, undefined);
    await expect(fn()).rejects.toThrow(NotFoundException);
    await expect(fn()).rejects.toThrow(CategoryMessage.NOT_FOUND);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should not find category using default findCategoryDto is defined but empty', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const fn = () => categoryService.findById(categoryId4, {});
    await expect(fn()).rejects.toThrow(NotFoundException);
    await expect(fn()).rejects.toThrow(CategoryMessage.NOT_FOUND);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should not find category when findCategoryDto values are defined', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const fn = () =>
      categoryService.findById(categoryId4, {
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      });
    await expect(fn()).rejects.toThrow(NotFoundException);
    await expect(fn()).rejects.toThrow(CategoryMessage.NOT_FOUND);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should reject find category when findCategoryDto is number', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const fn = () =>
      categoryService.findById(
        categoryId4,
        1 as unknown as FindCategoryRequestDTO,
      );
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryMessage.DATA_INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should reject find category when findCategoryDto is boolean', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const fn = () =>
      categoryService.findById(
        categoryId4,
        true as unknown as FindCategoryRequestDTO,
      );
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryMessage.DATA_INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should reject find category when findCategoryDto is string', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const fn = () =>
      categoryService.findById(
        categoryId4,
        '{}' as unknown as FindCategoryRequestDTO,
      );
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryMessage.DATA_INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should reject find category when findCategoryDto is array', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const fn = () =>
      categoryService.findById(
        categoryId4,
        [] as unknown as FindCategoryRequestDTO,
      );
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryMessage.DATA_INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });
});
