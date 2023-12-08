import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { Category } from '../../../../src/modules/stock/category/models/category/category.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategory,
} from '../../../../src/test/category/test-category-utils';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('CategoryService', () => {
  let app: INestApplication;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  let rootToken: string;

  const CategoryIdMessage = new UuidMessage('category id');

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

  describe('CategoryController (e2e) - find /categories (main)', () => {
    it('should find category for id', async () => {
      // id 1
      const c1 = new Category();
      c1.name = 'Category 1';
      c1.active = true;
      await categoryRepo.save(c1);

      // id 2
      const c2 = new Category();
      c2.name = 'Category 2';
      c2.active = true;
      await categoryRepo.save(c2);

      // id 3
      const c3 = new Category();
      c3.name = 'Category 3';
      c3.parent = c1;
      c3.active = true;
      await categoryRepo.save(c3);

      // id 4
      const c4 = new Category();
      c4.name = 'Category 4';
      c4.parent = c1;
      c4.active = true;
      await categoryRepo.save(c4);

      // id 5
      const c5 = new Category();
      c5.name = 'Category 5';
      c5.parent = c3;
      c5.active = true;
      await categoryRepo.save(c5);

      const categories = [c1, c2, c3, c4, c5];
      for (const category of categories) {
        await categoryRepo.save(category);
      }
      const categoriesBefore = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/categories/${c3.id}`,
        { query: '{}' },
        rootToken,
        HttpStatus.OK,
      );
      const categoriesAfter = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .getMany();
      expect(categoriesAfter).toStrictEqual(categoriesBefore);
      testValidateCategory(response, categoriesBefore[2]);
      expect(response.parent).toBeDefined();
      expect(response.parent.id).toEqual(categoriesAfter[0].id);
      expect(response.parent.name).toEqual(categoriesAfter[0].name);
      expect(response.parent.active).toEqual(categoriesAfter[0].active);
    });

    it('should fail when categoryId is invalid', async () => {
      await insertCategories({ name: 'Category 1', active: true });
      const categoriesBefore = await categoryRepo.find();
      const response = await testGetMin(
        app,
        `/categories/not-a-valid-uuid`,
        { query: JSON.stringify({ name: 'New Category Name', active: true }) },
        rootToken,
        HttpStatus.BAD_REQUEST,
      );
      expect(response).toEqual({
        error: ExceptionText.BAD_REQUEST,
        message: CategoryIdMessage.INVALID,
        statusCode: HttpStatus.BAD_REQUEST,
      });
      expect(await categoryRepo.find()).toStrictEqual(categoriesBefore);
    });

    it('should fail when category does not exists', async () => {
      await insertCategories({ name: 'Category 1', active: true });
      const categoriesBefore = await categoryRepo.find();
      const response = await testGetMin(
        app,
        `/categories/f136f640-90b7-11ed-a2a0-fd911f8f7f38`,
        { query: JSON.stringify({ name: 'New Category Name', active: true }) },
        rootToken,
        HttpStatus.NOT_FOUND,
      );
      expect(response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
      expect(await categoryRepo.find()).toStrictEqual(categoriesBefore);
    });
  });
});
