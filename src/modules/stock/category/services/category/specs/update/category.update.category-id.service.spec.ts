import {
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
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService.update (categoryId)', () => {
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

  it(`should accept when categoryId is valid`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false, parentPosition: 1 },
    );
    const categoryId = categoryId1;
    const data = { name: 'New Name' };
    const expectedResults = [
      { id: categoryId1, name: 'New Name', active: true },
      {
        id: categoryId2,
        name: 'Category 2',
        active: false,
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

  it(`should reject when categoryId is null`, async () => {
    const fn = () => categoryService.update(null, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(CategoryMessage.REQUIRED_CATEGORY_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when categoryId is undefined`, async () => {
    const fn = () => categoryService.update(undefined, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(CategoryMessage.REQUIRED_CATEGORY_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when categoryId is number`, async () => {
    const fn = () =>
      categoryService.update(1 as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(CategoryMessage.INVALID_CATEGORY_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when categoryId is boolean`, async () => {
    const fn = () =>
      categoryService.update(true as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(CategoryMessage.INVALID_CATEGORY_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when categoryId is invalid string`, async () => {
    const fn = () =>
      categoryService.update('not-a-valid-uuid' as unknown as string, {
        name: 'New Name',
      });
    await expect(fn()).rejects.toThrow(CategoryMessage.INVALID_CATEGORY_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when categoryId is array`, async () => {
    const fn = () =>
      categoryService.update([] as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(CategoryMessage.INVALID_CATEGORY_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when categoryId is object`, async () => {
    const fn = () =>
      categoryService.update({} as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(CategoryMessage.INVALID_CATEGORY_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when categoryId is not found`, async () => {
    const fn = () =>
      categoryService.update(
        'f136f640-90b7-11ed-a2a0-fd911f8f7f38' as unknown as string,
        { name: 'New Name' },
      );
    await expect(fn()).rejects.toThrow(CategoryMessage.NOT_FOUND);
    await expect(fn()).rejects.toThrow(NotFoundException);
  });
});
