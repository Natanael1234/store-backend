import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
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
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('CategoryController (e2e) - get/:categoryId /categories (query)', () => {
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
    const tokens = await testBuildAuthenticationScenario(module);
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

  it('should find category using default query when query is null', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify(null) },
      rootToken,
      HttpStatus.OK,
    );
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category using default query when query is empty', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
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
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category and use query values when query is defined', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      {
        query: JSON.stringify({
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.DELETED,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId4,
      name: 'Category 4',
      active: false,
      deleted: true,
    });
  });

  it('should not find category using default query when query is null string', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: 'null' },
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
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should not find category using default query when query is null', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: null },
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
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should not find category using default query when query is undefined', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: undefined },
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
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should not find category using default query when query empty', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
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
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should not find category when query values are defined', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      {
        query: JSON.stringify({
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
        }),
      },
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
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should reject when query is number', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: JSON.stringify(1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: CategoryMessage.DATA_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should reject when query is boolean', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: JSON.stringify(true) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: CategoryMessage.DATA_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should reject when query is (invalid) string', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: JSON.stringify('{}') },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: CategoryMessage.DATA_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });

  it('should reject when query is array', async () => {
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: false },
        { name: 'Category 4', active: false, deletedAt: new Date() },
      );
    const response = await testGetMin(
      app,
      `/categories/${categoryId4}`,
      { query: JSON.stringify([]) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: CategoryMessage.DATA_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
      { id: categoryId3, name: 'Category 3', active: false },
      { id: categoryId4, name: 'Category 4', active: false, deleted: true },
    ]);
  });
});
