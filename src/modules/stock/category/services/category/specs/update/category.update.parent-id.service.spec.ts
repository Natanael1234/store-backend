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

const ParentIdMessage = new UuidMessage('parent id');

describe('CategoryService.update (parentId)', () => {
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

  it(`should accept update when parentId is valid`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoryId = categoryId2;
    const data = { parentId: categoryId1 };
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

  it(`should accept update when parentId is null`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false, parentPosition: 1 },
    );
    const ret = await categoryService.update(categoryId2, { parentId: null });
    expect(ret).toBeDefined();
    testValidateCategory(ret, {
      id: categoryId2,
      name: 'Category 2',
      active: false,
      parent: null,
    });
    const categoriesAfter = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .getMany();
    testValidateCategories(categoriesAfter, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false, parent: null },
    ]);
  });

  it(`should accept update when parentId is undefined`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false, parentPosition: 1 },
    );
    const updatedCategory = await categoryService.update(categoryId2, {
      name: 'New Name',
      parentId: undefined,
    });
    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true },
      {
        id: categoryId2,
        name: 'New Name',
        active: false,
        parent: { id: categoryId1, name: 'Category 1', active: true },
      },
    ];
    testValidateCategory(updatedCategory, expectedResults[1]);
    const categoriesAfter = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .getMany();
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it('should reject update when parentId is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId2, { parentId: 1 as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentId: ParentIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject update when parentId is invalid string', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId2, { parentId: 'not-a-valid-uuid' });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentId: ParentIdMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject update when parentId is boolean', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId2, {
        parentId: true as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentId: ParentIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject update when parentId is array', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId2, {
        parentId: [] as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentId: ParentIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject update when parentId is object', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId2, {
        parentId: {} as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentId: ParentIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject update when parent is not found', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, {
        parentId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
      });
    await expect(fn()).rejects.toThrow(NotFoundException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.PARENT_CATEGORY_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
  });

  it(`should reject update when parent category is the same category being updated`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, { parentId: categoryId1 });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryMessage.CANNOT_PARENT_ITSELF,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it(`should reject update when parent category is descendent of the category being updated`, async () => {
    const [categoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
      { name: 'Category 2', active: true, parentPosition: 2 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoryId1, { parentId: categoryId3 });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: CategoryMessage.CANNOT_DESCEND_FROM_ITSELF,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
