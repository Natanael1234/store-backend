import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService.delete', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryService = module.get<CategoryService>(CategoryService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  describe('delete', () => {
    it('should delete category', async () => {
      const [categoriesId1, categoryId2, categoryId3] = await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
      );

      const categoriesBefore = await categoryRepo.find();
      const serviceCategory = await categoryService.delete(categoryId2);
      const categoriesAfter = await categoryRepo.find();

      expect(categoriesAfter).toStrictEqual([
        categoriesBefore[0],
        categoriesBefore[2],
      ]);
      const allCategoriesAfter = await categoryRepo.find({ withDeleted: true });
      expect(allCategoriesAfter.map((category) => category.id)).toEqual([
        categoriesId1,
        categoryId2,
        categoryId3,
      ]);
    });

    it('should fail when categoryId is not defined', async () => {
      const categoryData = [
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
        { name: 'Category 4', parentPosition: 1 },
      ];
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
      );
      const categoriesBefore = await categoryRepo.find();

      const fn = () => categoryService.delete(null);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(await categoryRepo.find()).toStrictEqual(categoriesBefore);
      await expect(fn()).rejects.toThrow(CategoryMessage.ID_REQUIRED);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: CategoryMessage.ID_REQUIRED,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail when category does not exists', async () => {
      const categoryData = [
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
        { name: 'Category 4', parentPosition: 1 },
      ];
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
      );
      const categoriesBefore = await categoryRepo.find();

      const fn = () =>
        categoryService.delete('f136f640-90b7-11ed-a2a0-fd911f8f7f38');
      await expect(fn()).rejects.toThrow(NotFoundException);
      expect(await categoryRepo.find()).toStrictEqual(categoriesBefore);
      await expect(fn()).rejects.toThrow(CategoryMessage.NOT_FOUND);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.NOT_FOUND,
          message: CategoryMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
    });
  });
});
