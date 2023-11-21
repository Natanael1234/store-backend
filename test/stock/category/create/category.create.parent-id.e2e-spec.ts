import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
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
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

const ParentIdMessage = new UuidMessage('parent id');

describe('CategoryController (e2e) - post /categories (parentId)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let categoryRepo: CategoryRepository;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    categoryRepo = moduleFixture.get<CategoryRepository>(CategoryRepository);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
  });

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  it(`should accept create when parentId is valid`, async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'Category 2', active: false, parentId: categoryId1 },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true, parent: null },
      {
        id: response.id,
        name: 'Category 2',
        active: false,
        parent: { id: categoryId1, name: 'Category 1', active: true },
      },
    ];
    testValidateCategory(response, expectedResults[1]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it(`should accept to create when parentId is null`, async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const created = await testPostMin(
      app,
      '/categories',
      { name: 'Category 2', active: false, parentId: null },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true, parent: null },
      { id: created.id, name: 'Category 2', active: false, parent: null },
    ];
    testValidateCategory(created, expectedResults[1]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it(`should accept to create when parentId is undefined`, async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const created = await testPostMin(
      app,
      '/categories',
      { name: 'Category 2', active: false, parentId: undefined },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true, parent: null },
      { id: created.id, name: 'Category 2', active: false, parent: null },
    ];

    testValidateCategory(created, expectedResults[1]);
    const registers = await categoryRepo.find({
      relations: { parent: true },
    });
    testValidateCategories(registers, expectedResults);
  });

  it('should reject when parentId is number', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'New Category', active: true, parentId: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await categoryRepo.find();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
  });

  it('should reject when parentId is boolean', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'New Category', active: true, parentId: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when parentId is object', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'New Category', active: true, parentId: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when parentId is invalid string', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'New Category', active: true, parentId: 'not-a-valid-uuid' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when parentId is array', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'New Category', active: true, parentId: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentId: ParentIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it(`should reject create when parentId category is not found`, async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const response = await testPostMin(
      app,
      '/categories',
      {
        name: 'Category 1',
        active: true,
        parentId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
      },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.PARENT_CATEGORY_NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it.skip('Should not create cycles in category hierarchy', () => {});
});
