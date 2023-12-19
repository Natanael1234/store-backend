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
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const CategoryIdMessage = new UuidMessage('category id');

describe('CategoryService.findForId (categoryId)', () => {
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

  it('should find category for valid categoryId', async () => {
    const [categoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3' },
    );
    const response = await categoryService.findById(categoryId2);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    ]);
    testValidateCategory(response, { name: 'Category 2', active: true });
  });

  it('should reject when categoryId is null', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () => categoryService.findById(null);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    await expect(fn()).rejects.toThrow(CategoryIdMessage.REQUIRED);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryIdMessage.REQUIRED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when categoryId is undefined', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () => categoryService.findById(undefined);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    await expect(fn()).rejects.toThrow(CategoryIdMessage.REQUIRED);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryIdMessage.REQUIRED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when categoryId is boolean', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () => categoryService.findById(true as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    await expect(fn()).rejects.toThrow(CategoryIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when categoryId is number', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () => categoryService.findById(1 as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    await expect(fn()).rejects.toThrow(CategoryIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when categoryId is invalid string', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () => categoryService.findById('not-a-valid-uuid');
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    await expect(fn()).rejects.toThrow(CategoryIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when categoryId is array', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () => categoryService.findById([] as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    await expect(fn()).rejects.toThrow(CategoryIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when categoryId is object', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () => categoryService.findById({} as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    await expect(fn()).rejects.toThrow(CategoryIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when category does not exists', async () => {
    await insertCategories({ name: 'Category 1', active: true });
    const uuid = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
    const fn = () => categoryService.findById(uuid);
    await expect(fn()).rejects.toThrow(NotFoundException);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
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
  });
});
