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
} from '../../../../src/test/category/test-category-utils';
import {
  testBuildAuthenticationScenario,
  testDeleteMin,
} from '../../../utils/test-end-to-end.utils';

const CategoryIdMessage = new UuidMessage('category id');

describe('CategoryController (e2e) - delete /categories/:categoryId (main)', () => {
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

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  describe('delete', () => {
    it('should delete category', async () => {
      const [categoriesId1, categoryId2, categoryId3] = await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
      );

      const categoriesBefore = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .getMany();
      const response = await testDeleteMin(
        app,
        `/categories/${categoryId2}`,
        { query: `{}` },
        rootToken,
        HttpStatus.OK,
      );
      // TODO: teste response
      const categoriesAfter = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .getMany();
      expect(categoriesAfter).toStrictEqual([
        categoriesBefore[0],
        categoriesBefore[2],
      ]);
      const allCategoriesAfter = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .withDeleted()
        .getMany();
      expect(allCategoriesAfter.map((category) => category.id)).toEqual([
        categoriesId1,
        categoryId2,
        categoryId3,
      ]);
    });

    it('should fail when categoryId is invalid', async () => {
      await insertCategories({ name: 'Category 1', active: true });
      const categoriesBefore = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .getMany();
      const response = await testDeleteMin(
        app,
        `/categories/not-a-valid-uuid`,
        { query: `{}` },
        rootToken,
        HttpStatus.BAD_REQUEST,
      );
      expect(response).toEqual({
        error: ExceptionText.BAD_REQUEST,
        message: CategoryIdMessage.INVALID,
        statusCode: HttpStatus.BAD_REQUEST,
      });
      expect(
        await categoryRepo
          .createQueryBuilder(CategoryConstants.CATEGORY)
          .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
          .getMany(),
      ).toStrictEqual(categoriesBefore);
    });

    it('should fail when category does not exists', async () => {
      await insertCategories({ name: 'Category 1', active: true });
      const categoriesBefore = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .getMany();
      const response = await testDeleteMin(
        app,
        `/categories/f136f640-90b7-11ed-a2a0-fd911f8f7f38`,
        { query: `{}` },
        rootToken,
        HttpStatus.NOT_FOUND,
      );
      expect(response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
      expect(
        await categoryRepo
          .createQueryBuilder(CategoryConstants.CATEGORY)
          .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
          .getMany(),
      ).toStrictEqual(categoriesBefore);
    });
  });
});
