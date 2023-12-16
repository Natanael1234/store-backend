import { HttpStatus, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

1;
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

  async function getCategories() {
    return categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
  }

  async function insertCategories(
    ...categories: TestCategoryInsertParams[]
  ): Promise<string[]> {
    return testInsertCategories(categoryRepo, categories);
  }

  it('should find active category when publicAccess is true', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1, true);
    expect(response).toEqual(categoriesBefore[0]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should find active category when publicAccess is false', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1, false);
    expect(response).toEqual(categoriesBefore[0]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should find active category when publicAccess is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1, null);
    expect(response).toEqual(categoriesBefore[0]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should find active category when publicAccess is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1, undefined);
    expect(response).toEqual(categoriesBefore[0]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should find active category when publicAccess is not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1);
    expect(response).toEqual(categoriesBefore[0]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should find not find inactive category when publicAccess is false', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId2, false);
    expect(response).toEqual(categoriesBefore[1]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should find not find inactive category when publicAccess is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId2, null);
    expect(response).toEqual(categoriesBefore[1]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should find not find inactive category when publicAccess is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId2, undefined);
    expect(response).toEqual(categoriesBefore[1]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should find not find inactive category when publicAccess is not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId2);
    expect(response).toEqual(categoriesBefore[1]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should not find inactive category when publicAccess is true', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await getCategories();
    const fn = () => categoryService.findById(categoryId2, true);
    await expect(fn()).rejects.toThrow(NotFoundException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    expect(await getCategories()).toEqual(categoriesBefore);
  });
});
