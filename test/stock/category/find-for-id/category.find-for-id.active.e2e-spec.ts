import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../src/test/category/test-category-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('CategoryController (e2e) - get/:categoryId /categories (active)', () => {
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
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .orderBy(CategoryConstants.CATEGORY_NAME)
        .getMany(),
    );
  }

  it('should find active category when user is root', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[0]);
  });

  it('should find active category when user is admin', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({}) },
      adminToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[0]);
  });

  it('should find active category when user is basic user', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({}) },
      userToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[0]);
  });

  it('should find active category when user is not authenticated', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({}) },
      null,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[0]);
  });

  it('should find inactive category when user is root', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[1]);
  });

  it('should find inactive category when user is admin', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({}) },
      adminToken,
      HttpStatus.OK,
    );
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
    expect(response).toEqual(categoriesBefore[1]);
  });

  it('should not find inactive category when user is basic user', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({}) },
      userToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
  });

  it('should not find inactive category when user is not authenticated', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const categoriesBefore = await findCategories();
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({}) },
      null,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const categoriesAfter = await findCategories();
    expect(categoriesAfter).toEqual(categoriesBefore);
  });
});
