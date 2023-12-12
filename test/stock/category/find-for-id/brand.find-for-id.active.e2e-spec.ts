import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
  testValidateCategory,
} from '../../../../src/test/category/test-category-utils';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveFilterMessage = new BoolMessage('active');

describe('CategoryController (e2e) - get/:categoryId /categories (query.active)', () => {
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

  it('should find category when query.active filter is active', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
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

  it('should find category when query.active filter is inactive', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
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

  it('should find category when query.active filter is all', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
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

  it('should find active category when user is root', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
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

  it('should find inactive category when user is root', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
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

  it('should find active category when user is admin', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      adminToken,
      HttpStatus.OK,
    );
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

  it('should find inactive category when user is admin', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      adminToken,
      HttpStatus.OK,
    );
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

  it('should find active category when user is basic user', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      userToken,
      HttpStatus.OK,
    );
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

  it('should find active category when user is not authenticated', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      null,
      HttpStatus.OK,
    );
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

  it('should find category when query.active filter is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ active: null }) },
      rootToken,
      HttpStatus.OK,
    );
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

  it('should find category when query.active filter is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ active: undefined }) },
      rootToken,
      HttpStatus.OK,
    );
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

  it('should find category when query.active filter not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
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

  it('should not find category when query.active filter is active', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find category when query.active filter is inactive', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );

    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find invactive category when user is basic user', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      userToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find invactive category when user is not authenticated', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      null,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find category when query.active filter is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ active: null }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find category when query.active filter is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ active: undefined }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should not find category when query.active filter is not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when query.active filter is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({ active: 1 as unknown as ActiveFilter.ACTIVE }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when query.active filter is boolean', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({
          active: true as unknown as ActiveFilter.ACTIVE,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when query.active filter is invalid string', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );

    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({
          active: 'invalid' as unknown as ActiveFilter.ACTIVE,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when query.active filter is array', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({ active: [] as unknown as ActiveFilter.ACTIVE }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: false },
    ]);
  });

  it('should reject when query.active filter is object', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({ active: {} as unknown as ActiveFilter.ACTIVE }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
