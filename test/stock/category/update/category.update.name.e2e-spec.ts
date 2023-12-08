import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConfigs } from '../../../../src/modules/stock/category/configs/category/category.configs';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../src/modules/system/messages/text/text.messages';
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

const NameMessage = new TextMessage('name', {
  minLength: CategoryConfigs.NAME_MIN_LENGTH,
  maxLength: CategoryConfigs.NAME_MAX_LENGTH,
});

describe('CategoryController (e2e) - patch /categories/:categoryId (name)', () => {
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

  async function findCategories(includeParents?: boolean) {
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
    const updatedCategory = await testPatchMin(
      app,
      `/categories/${categoryId}`,
      data,
      rootToken,
      HttpStatus.OK,
    );
    testValidateCategory(updatedCategory, expectedResults[0]);
    const categoriesAfter = await findCategories(true);
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
    const updatedCategory = await testPatchMin(
      app,
      `/categories/${categoryId}`,
      data,
      rootToken,
      HttpStatus.OK,
    );
    testValidateCategory(updatedCategory, expectedResults[0]);
    const categoriesAfter = await findCategories(true);
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
    const updatedCategory = await testPatchMin(
      app,
      `/categories/${categoryId}`,
      data,
      rootToken,
      HttpStatus.OK,
    );
    expect(updatedCategory).toBeDefined();
    testValidateCategory(updatedCategory, expectedResults[0]);
    const categoriesAfter = await findCategories(true);
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it('should reject when name is shorter than allowed', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { name: 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH - 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MIN_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is longer than allowed', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { name: 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH + 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { name: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { name: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is boolean', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { name: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is array', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { name: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is object', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { name: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
