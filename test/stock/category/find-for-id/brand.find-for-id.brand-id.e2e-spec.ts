import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
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

const CategoryIdMessage = new UuidMessage('category id');

describe('CategoryController (e2e) - get/:categoryId /categories (categoryId)', () => {
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

  it('should find category for valid categoryId', async () => {
    const [categoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3' },
    );
    const response = await testGetMin(
      app,
      `/categories/${categoryId2}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    ]);
    testValidateCategory(response, { name: 'Category 2', active: true });
  });

  it('should reject when categoryId is invalid string', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const response = await testGetMin(
      app,
      `/categories/not-a-valid-uuid`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.BAD_REQUEST,
    );
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    expect(response).toEqual({
      error: ExceptionText.BAD_REQUEST,
      message: CategoryIdMessage.INVALID,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('should reject when category does not exists', async () => {
    await insertCategories({ name: 'Category 1', active: true });
    const response = await testGetMin(
      app,
      `/categories/f136f640-90b7-11ed-a2a0-fd911f8f7f38`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });
});
