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
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const DeletedFilterMessage = new BoolMessage('deleted');

describe('CategoryService.findForId (deleted)', () => {
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

  it('should find category when findCategoryDto.delete filter is not_deleted', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await categoryService.findById(categoryId1, {
      deleted: DeletedFilter.NOT_DELETED,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true, deleted: false },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
      deleted: false,
    });
  });

  it('should find category when findCategoryDto.deleted filter is deleted', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await categoryService.findById(categoryId2, {
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
    ]);
    testValidateCategory(response, {
      id: categoryId2,
      name: 'Category 2',
      active: true,
      deleted: true,
    });
  });

  it('should find category when findCategoryDto.deleted filter is all', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await categoryService.findById(categoryId2, {
      deleted: DeletedFilter.ALL,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId2,
      name: 'Category 2',
      active: true,
      deleted: true,
    });
  });

  it('should find category when findCategoryDto.deleted filter is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await categoryService.findById(categoryId1, {
      deleted: null,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category when findCategoryDto.deleted filter is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await categoryService.findById(categoryId1, {
      deleted: undefined,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category when findCategoryDto.deleted filter not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
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
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should not find category when findCategoryDto.deleted filter is not_deleted', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.findById(categoryId2, {
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
    ]);
  });

  it('should not find category when findCategoryDto.deleted filter is deleted', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.findById(categoryId1, { deleted: DeletedFilter.DELETED });
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
    ]);
  });

  it('should not find category when findCategoryDto.deleted filter is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () => categoryService.findById(categoryId2, { deleted: null });
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
    ]);
  });

  it('should not find category when findCategoryDto.deleted filter is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.findById(categoryId2, { deleted: undefined });
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
    ]);
  });

  it('should not find category when findCategoryDto.deleted filter is not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () => categoryService.findById(categoryId2, {});
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
    ]);
  });

  it('should reject when findCategoryDto.deleted filter is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        deleted: 1 as unknown as DeletedFilter.NOT_DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });

  it('should reject when findCategoryDto.deleted filter is boolean', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        deleted: true as unknown as DeletedFilter.NOT_DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });

  it('should reject when findCategoryDto.deleted filter is invalid string', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        deleted: 'invalid' as unknown as DeletedFilter.NOT_DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });

  it('should reject when findCategoryDto.deleted filter is array', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        deleted: [] as unknown as DeletedFilter.NOT_DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });

  it('should reject when findCategoryDto.deleted filter is object', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        deleted: {} as unknown as DeletedFilter.DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });
});
