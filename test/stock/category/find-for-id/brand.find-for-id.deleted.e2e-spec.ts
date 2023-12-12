import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { DeletedFilter } from '../../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
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

const DeletedFilterMessage = new BoolMessage('deleted');

describe('CategoryController (e2e) - get/:categoryId /categories  (query.deleted)', () => {
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

  it('should find category when query.delete filter is not_deleted', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
      rootToken,
      HttpStatus.OK,
    );
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true, deleted: false },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
      deleted: false,
    });
  });

  it('should find category when query.deleted filter is deleted', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
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
    ]);
    testValidateCategory(response, {
      id: categoryId2,
      name: 'Category 2',
      active: true,
      deleted: true,
    });
  });

  it('should find category when query.deleted filter is all', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
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
    ]);
    testValidateCategory(response, {
      id: categoryId2,
      name: 'Category 2',
      active: true,
      deleted: true,
    });
  });

  it('should find not deleted categories when users is root', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
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
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
      deleted: false,
    });
  });

  it('should find deleted categories when users is root', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
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
    ]);
    testValidateCategory(response, {
      id: categoryId2,
      name: 'Category 2',
      active: true,
      deleted: true,
    });
  });

  it('should find not deleted categories when users is admin', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      adminToken,
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
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
      deleted: false,
    });
  });

  it('should find deleted categories when users is basic user', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      adminToken,
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
    ]);
    testValidateCategory(response, {
      id: categoryId2,
      name: 'Category 2',
      active: true,
      deleted: true,
    });
  });

  it('should find not deleted categories when users is basic user', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      userToken,
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
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
      deleted: false,
    });
  });

  it('should find not deleted categories when users is not authenticated', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      null,
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
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
      deleted: false,
    });
  });

  it('should find category when query.deleted filter is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ deleted: null }) },
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
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category when query.deleted filter is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ deleted: undefined }) },
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
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should find category when query.deleted filter not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
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
    ]);
    testValidateCategory(response, {
      id: categoryId1,
      name: 'Category 1',
      active: true,
    });
  });

  it('should not find category when query.deleted filter is not_deleted', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
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
    ]);
  });

  it('should not find category when query.deleted filter is deleted', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );

    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    await expect(response).toEqual({
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
    ]);
  });

  it('should not find deletes category when user is basic user', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );

    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
      userToken,
      HttpStatus.NOT_FOUND,
    );
    await expect(response).toEqual({
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
    ]);
  });

  it('should not find deleted category when user is not authenticated', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );

    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
      null,
      HttpStatus.NOT_FOUND,
    );
    await expect(response).toEqual({
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
    ]);
  });

  it('should not find category when query.deleted filter is null', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ deleted: null }) },
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
    ]);
  });

  it('should not find category when query.deleted filter is undefined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({ deleted: undefined }) },
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
    ]);
  });

  it('should not find category when query.deleted filter is not defined', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
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
      .withDeleted()
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true, deleted: true },
    ]);
  });

  it('should reject when query.deleted filter is number', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({
          deleted: 1 as unknown as DeletedFilter.NOT_DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });

  it('should reject when query.deleted filter is boolean', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({
          deleted: true as unknown as DeletedFilter.NOT_DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });

  it('should reject when query.deleted filter is invalid string', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({
          deleted: 'invalid' as unknown as DeletedFilter.NOT_DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });

  it('should reject when query.deleted filter is array', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({
          deleted: [] as unknown as DeletedFilter.NOT_DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });

  it('should reject when query.deleted filter is object', async () => {
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId1}`,
      {
        query: JSON.stringify({
          deleted: {} as unknown as DeletedFilter.DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
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
    ]);
  });
});
