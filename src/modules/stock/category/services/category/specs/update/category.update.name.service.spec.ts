import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
  testValidateCategory,
} from '../../../../../../../test/category/test-category-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const NameMessage = new TextMessage('name', {
  minLength: CategoryConfigs.NAME_MIN_LENGTH,
  maxLength: CategoryConfigs.NAME_MAX_LENGTH,
});

describe('CategoryService.update (name)', () => {
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  let categoryService: CategoryService;

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

  it(`should accept update when name has min length allowed`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const name = 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH);
    const categoryId = categoryId1;
    const data = { name };
    const expectedResults = [
      { id: categoryId1, name, active: true },
      {
        id: categoryId2,
        name: 'Category 2',
        active: true,
        parent: { id: categoryId1, name, active: true },
      },
    ];
    const updatedCategory = await categoryService.update(categoryId, data);
    expect(updatedCategory).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.id == categoryId);
    testValidateCategory(updatedCategory, expectedResult);
    const categoriesAfter = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .getMany();
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it(`should accept update when name has max length allowed`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const name = 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH);
    const categoryId = categoryId1;
    const data = { name };
    const expectedResults = [
      { id: categoryId1, name, active: true },
      {
        id: categoryId2,
        name: 'Category 2',
        active: true,
        parent: { id: categoryId1, name, active: true },
      },
    ];
    const updatedCategory = await categoryService.update(categoryId, data);
    expect(updatedCategory).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.id == categoryId);
    testValidateCategory(updatedCategory, expectedResult);
    const categoriesAfter = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .getMany();
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it(`should accept update when name is undefined`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoryId = categoryId1;
    const data = { name: undefined, active: false };
    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: false },
      {
        id: categoryId2,
        name: 'Category 2',
        active: true,
        parent: { id: categoryId1, name: 'Category 1', active: false },
      },
    ];
    const updatedCategory = await categoryService.update(categoryId, data);
    expect(updatedCategory).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.id == categoryId);
    testValidateCategory(updatedCategory, expectedResult);
    const categoriesAfter = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .getMany();
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it('should reject when name is shorter than allowed', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, {
        name: 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH - 1),
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.MIN_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is longer than allowed', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, {
        name: 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH + 1),
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () => categoryService.update(categoryId1, { name: null });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, { name: 1 as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is boolean', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, { name: true as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is array', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, { name: [] as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is object', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, { name: {} as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
