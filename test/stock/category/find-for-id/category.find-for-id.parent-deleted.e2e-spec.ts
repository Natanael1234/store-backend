import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../src/test/category/test-category-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('CategoryController (e2e) - get/:categoryId /categories (parent.deleted)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  let rootToken: string;
  let adminToken: string;
  let userToken: string;

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
    const tokens = await testBuildAuthenticationScenario(module);
    userToken = tokens.userToken;
    adminToken = tokens.adminToken;
    rootToken = tokens.rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close();
  });

  async function insertCategories(
    ...categories: TestCategoryInsertParams[]
  ): Promise<string[]> {
    return testInsertCategories(categoryRepo, categories);
  }

  async function findCategories() {
    return objectToJSON(
      await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .withDeleted()
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .withDeleted()
        .orderBy(CategoryConstants.CATEGORY_NAME)
        .getMany(),
    );
  }

  async function createTestScenario() {
    return await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
      { name: 'Category 3', active: true, parentPosition: 1 },
      { name: 'Category 4', active: true, parentPosition: 2 },
    );
  }

  it('should retrieve category and its not deleted parent when user is root', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await createTestScenario();
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId3}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[2]);
  });

  it('should retrieve category and its not deleted parent when user is admin', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await createTestScenario();
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId3}`,
      { query: JSON.stringify({}) },
      adminToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[2]);
  });

  it('should retrieve category and its not deleted parent when user is basic user', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await createTestScenario();
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId3}`,
      { query: JSON.stringify({}) },
      userToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[2]);
  });

  it('should retrieve category and its not deleted parent when user is not authenticated', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await createTestScenario();
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId3}`,
      { query: JSON.stringify({}) },
      null,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[2]);
  });

  it('should retrieve category and its deleted parent when user is root', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await createTestScenario();
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[3]);
  });

  it('should retrieve category and its deleted parent when user is admin', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await createTestScenario();
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: JSON.stringify({}) },
      adminToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[3]);
  });

  it('should retrieve category without its deleted parent when user is basic user', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await createTestScenario();
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: JSON.stringify({}) },
      userToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual({ ...categoriesBefore[3], parent: null });
  });

  it('should retrieve category without its deleted parent when user is not authenticated', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await createTestScenario();
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: JSON.stringify({}) },
      null,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual({ ...categoriesBefore[3], parent: null });
  });
});
