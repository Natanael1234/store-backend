import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
  testValidateCategory,
} from '../../../../../../../test/category/test-category-utils';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const ActiveMessage = new BoolMessage('active');

describe('CategoryService.update (active)', () => {
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

  it(`should accept update when active is true`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: false },
      { name: 'Category 2', active: false, parentPosition: 1 },
    );
    const categoryId = categoryId1;
    const data = { active: true };
    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true },
      {
        id: categoryId2,
        name: 'Category 2',
        active: false,
        parent: { id: categoryId1, name: 'Category 1', active: true },
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

  it(`should accept update when active is false`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoryId = categoryId1;
    const data = { active: false };
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

  it(`should accept update when active is undefined`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoryId = categoryId1;
    const data = { name: 'New Name', active: undefined };
    const expectedResults = [
      { id: categoryId1, name: 'New Name', active: true },
      {
        id: categoryId2,
        name: 'Category 2',
        active: true,
        parent: { id: categoryId1, name: 'New Name', active: true },
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

  it('should reject when active is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () => categoryService.update(categoryId1, { active: null });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, { active: 1 as unknown as boolean });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
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

  it('should reject when active is string', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, {
        active: 'true' as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
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
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, { active: [] as unknown as boolean });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
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
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, { active: {} as unknown as boolean });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
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
