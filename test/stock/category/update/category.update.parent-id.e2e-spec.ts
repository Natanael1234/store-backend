import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
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

const ParentIdMessage = new UuidMessage('parent id');

describe('CategoryController (e2e) - patch /categories/:categoryId (parentId)', () => {
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
    const updatedCategory = await testPatchMin(
      app,
      `/categories/${categoryId}`,
      data,
      rootToken,
      HttpStatus.OK,
    );
    testValidateCategory(updatedCategory, expectedResults[1]);
    const categoriesAfter = await findCategories(true);
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it(`should accept update when parentId is null`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false, parentPosition: 1 },
    );
    const ret = await testPatchMin(
      app,
      `/categories/${categoryId2}`,
      { parentId: null },
      rootToken,
      HttpStatus.OK,
    );
    expect(ret).toBeDefined();
    testValidateCategory(ret, {
      id: categoryId2,
      name: 'Category 2',
      active: false,
      parent: null,
    });
    const categoriesAfter = await findCategories(true);
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
    const updatedCategory = await testPatchMin(
      app,
      `/categories/${categoryId2}`,
      { name: 'New Name', parentId: undefined },
      rootToken,
      HttpStatus.OK,
    );
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
    const categoriesAfter = await findCategories(true);
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it('should reject update when parentId is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId2}`,
      { parentId: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when parentId is invalid string', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId2}`,
      { parentId: 'not-a-valid-uuid' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when parentId is boolean', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId2}`,
      { parentId: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when parentId is array', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId2}`,
      { parentId: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when parentId is object', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId2}`,
      { parentId: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when parent is not found', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { parentId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38' },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.PARENT_CATEGORY_NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it(`should reject update when parent category is the same category being updated`, async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { parentId: categoryId1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: CategoryMessage.CANNOT_PARENT_ITSELF,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it(`should reject update when parent category is descendent of the category being updated`, async () => {
    const [categoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
      { name: 'Category 2', active: true, parentPosition: 2 },
    );
    const categoriesBefore = await findCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoryId1}`,
      { parentId: categoryId3 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: CategoryMessage.CANNOT_DESCEND_FROM_ITSELF,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
