import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
  testValidateCategory,
} from '../../../../src/test/category/test-category-utils';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');

describe('CategoryController (e2e) - patch /categories/:categoryId (active)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  async function getCategories(includeParents?: boolean) {
    if (includeParents) {
      return categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .getMany();
    }
    return categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .getMany();
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
    const updatedCategory = await testPatchMin(
      app,
      `/categories/${categoryId}`,
      data,
      rootToken,
      HttpStatus.OK,
    );
    expect(updatedCategory).toBeDefined();
    testValidateCategory(updatedCategory, expectedResults[0]);
    const categoriesAfter = await getCategories(true);
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
    const updatedCategory = await testPatchMin(
      app,
      `/categories/${categoryId}`,
      data,
      rootToken,
      HttpStatus.OK,
    );
    expect(updatedCategory).toBeDefined();
    testValidateCategory(updatedCategory, expectedResults[0]);
    const categoriesAfter = await getCategories(true);
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
    const updatedCategory = await testPatchMin(
      app,
      `/categories/${categoryId}`,
      data,
      rootToken,
      HttpStatus.OK,
    );
    expect(updatedCategory).toBeDefined();
    testValidateCategory(updatedCategory, expectedResults[0]);
    const categoriesAfter = await getCategories(true);
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it('should reject when active is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await getCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { active: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await getCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await getCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { active: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await getCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is string', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await getCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { active: 'true' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await getCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is array', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await getCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { active: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await getCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is object', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await getCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { active: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await getCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
