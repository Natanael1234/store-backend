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
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const ActiveFilterMessage = new BoolMessage('active');

describe('CategoryService.findForId (active)', () => {
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

  it('should find category when findCategoryDto.active filter is active', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await categoryService.findById(categoryId1, {
      active: ActiveFilter.ACTIVE,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category when findCategoryDto.active filter is inactive', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await categoryService.findById(categoryId2, {
      active: ActiveFilter.INACTIVE,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
    testValidateCategory(response, {
      id: categoryId2,
      name: 'Category 2',
      active: false,
    });
  });

  it('should find category when findCategoryDto.active filter is all', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await categoryService.findById(categoryId2, {
      active: ActiveFilter.ALL,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
    testValidateCategory(response, {
      id: categoryId2,
      name: 'Category 2',
      active: false,
    });
  });

  it('should find category when findCategoryDto.active filter is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await categoryService.findById(categoryId1, {
      active: null,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category when findCategoryDto.active filter is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await categoryService.findById(categoryId1, {
      active: undefined,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category when findCategoryDto.active filter not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await categoryService.findById(categoryId1, {});
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should not find category when findCategoryDto.active filter is active', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const fn = () =>
      categoryService.findById(categoryId2, { active: ActiveFilter.ACTIVE });
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
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find category when findCategoryDto.active filter is inactive', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const fn = () =>
      categoryService.findById(categoryId1, { active: ActiveFilter.INACTIVE });
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
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find category when findCategoryDto.active filter is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const fn = () => categoryService.findById(categoryId2, { active: null });
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
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find category when findCategoryDto.active filter is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const fn = () =>
      categoryService.findById(categoryId2, { active: undefined });
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
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find category when findCategoryDto.active filter is not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
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
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when findCategoryDto.active filter is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        active: 1 as unknown as ActiveFilter.ACTIVE,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when findCategoryDto.active filter is boolean', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        active: true as unknown as ActiveFilter.ACTIVE,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when findCategoryDto.active filter is invalid string', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        active: 'invalid' as unknown as ActiveFilter.ACTIVE,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when findCategoryDto.active filter is array', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        active: [] as unknown as ActiveFilter.ACTIVE,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when findCategoryDto.active filter is object', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const fn = () =>
      categoryService.findById(categoryId1, {
        active: {} as unknown as ActiveFilter.ACTIVE,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });
});
