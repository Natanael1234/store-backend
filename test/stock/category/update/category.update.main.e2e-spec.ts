import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConfigs } from '../../../../src/modules/stock/category/configs/category/category.configs';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../src/modules/system/messages/text/text.messages';
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

const NameMessage = new TextMessage('name', {
  minLength: CategoryConfigs.NAME_MIN_LENGTH,
  maxLength: CategoryConfigs.NAME_MAX_LENGTH,
});
const ActiveMessage = new BoolMessage('active');
const ParentIdMessage = new UuidMessage('parent id');

describe('CategoryController (e2e) - patch /categories/:categoryId (main)', () => {
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

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  it('should update category', async () => {
    const [categoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true, parentPosition: 1 },
    );
    const categoryId = categoryId3;
    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true },
      {
        id: categoryId3,
        name: 'New Name',
        active: false,
        parent: { id: categoryId2, name: 'Category 2', active: true },
      },
    ];
    const updatedCategory = await testPatchMin(
      app,
      `/categories/${categoryId}`,
      { name: 'New Name', active: false, parentId: categoryId2 },
      rootToken,
      HttpStatus.OK,
    );
    testValidateCategory(updatedCategory, expectedResults[2]);
    const categoriesAfter = await getCategories(true);
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it('should reject with multiple errors', async () => {
    const [categoriesId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await getCategories();
    const response = await testPatchMin(
      app,
      `/categories/${categoriesId1}`,
      { name: 1, active: '1', parentId: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const categoriesAfter = await getCategories();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: {
        name: NameMessage.INVALID,
        active: ActiveMessage.INVALID,
        parentId: ParentIdMessage.STRING,
      },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
