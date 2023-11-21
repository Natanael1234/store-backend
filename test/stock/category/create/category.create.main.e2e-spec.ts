import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../src/modules/system/messages/text/text.messages';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import { testValidateCategories } from '../../../../src/test/category/test-category-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

const NameMessage = new TextMessage('name');
const ActiveMessage = new BoolMessage('active');
const ParendtIdMessage = new UuidMessage('parent id');

describe('CategoryController (e2e) - post /categories (main)', () => {
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

  it('should create categories', async () => {
    const c1 = await testPostMin(
      app,
      '/categories',
      { name: 'Category 1', active: true },
      rootToken,
      HttpStatus.CREATED,
    );
    const c2 = await testPostMin(
      app,
      '/categories',
      { name: 'Category 2', active: true },
      rootToken,
      HttpStatus.CREATED,
    );
    const c3 = await testPostMin(
      app,
      '/categories',
      { name: 'Category 3', active: true, parentId: c1.id },
      rootToken,
      HttpStatus.CREATED,
    );
    const c4 = await testPostMin(
      app,
      '/categories',
      { name: 'Category 4', active: true, parentId: c1.id },
      rootToken,
      HttpStatus.CREATED,
    );
    const c5 = await testPostMin(
      app,
      '/categories',
      { name: 'Category 5', active: true, parentId: c3.id },
      rootToken,
      HttpStatus.CREATED,
    );
    const createdCategories = [c1, c2, c3, c4, c5];
    const expectedCategories = [
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      {
        name: 'Category 3',
        active: true,
        parent: { id: c1.id, name: 'Category 1', active: true },
      },
      {
        name: 'Category 4',
        active: true,
        parent: { id: c1.id, name: 'Category 1', active: true },
      },
      {
        name: 'Category 5',
        active: true,
        parent: { id: c3.id, name: 'Category 3', active: true },
      },
    ];
    testValidateCategories(createdCategories, expectedCategories);
    const repositoryCategory = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .getMany();
    testValidateCategories(repositoryCategory, expectedCategories);
  });

  it('should reject when multiple errors', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: 1, active: {}, parentId: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: {
        name: NameMessage.INVALID,
        active: ActiveMessage.INVALID,
        parentId: ParendtIdMessage.STRING,
      },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
