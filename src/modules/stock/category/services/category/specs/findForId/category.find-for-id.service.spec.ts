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
  testValidateCategory,
} from '../../../../../../../test/category/test-category-utils';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { Category } from '../../../../models/category/category.entity';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  // let categoryRepo: Repository<Category>;
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

  describe.skip('findForId', () => {
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

      const categoriesBefore = await categoryRepo.find({
        order: { name: SortConstants.ASC },
        relations: { parent: true },
      });
      const serviceCategory = await categoryService.findById(c3.id);
      const categoriesAfter = await categoryRepo.find({
        order: { id: SortConstants.ASC },
        relations: { parent: true },
      });

      expect(categoriesAfter).toStrictEqual(categoriesBefore);
      testValidateCategory(serviceCategory, categoriesBefore[2]);
      expect(serviceCategory.parent).toBeDefined();
      expect(serviceCategory.parent.id).toEqual(categoriesAfter[0].id);
      expect(serviceCategory.parent.name).toEqual(categoriesAfter[0].name);
      expect(serviceCategory.parent.active).toEqual(categoriesAfter[0].active);
    });

    it('should fail when categoryId is not defined', async () => {
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
      );
      const categoriesBefore = await categoryRepo.find();

      const fn = () => categoryService.findById(null);
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
      const categoriesIds = await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
      );
      const categoriesBefore = await categoryRepo.find();

      const fn = () =>
        categoryService.findById('f136f640-90b7-11ed-a2a0-fd911f8f7f38');
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
