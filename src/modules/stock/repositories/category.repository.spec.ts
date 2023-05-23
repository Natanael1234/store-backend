import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../.jest/test-config.module';
import { TestCategoryData } from '../../../test/category/test-category-data';
import { testValidateCategoriesArrays } from '../../../test/category/test-category-utils';
import { CategoryMessage } from '../enums/messages/category-messages/category-messages.enum';
import { CategoryRepository } from './categoy.repository';

describe('CategoryRepository', () => {
  let module: TestingModule;
  let categoryRepo: CategoryRepository;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('bulkCreate', () => {
    it('should bulk create categories', async () => {
      const categoriesData = TestCategoryData.dataForRepository;
      const expected = [
        {
          id: 1,
          name: categoriesData[0].name,
          active: !!categoriesData[0].active,
          parent: null,
        },
        {
          id: 2,
          name: categoriesData[1].name,
          active: !!categoriesData[1].active,
          parent: null,
        },
        {
          id: 3,
          name: categoriesData[2].name,
          active: !!categoriesData[2].active,
          parent: null,
        },
        {
          id: 4,
          name: categoriesData[3].name,
          active: !!categoriesData[3].active,
          parent: null,
        },
      ];
      expected[1].parent = expected[0];
      expected[2].parent = expected[1];
      expected[3].parent = expected[0];

      const created = await categoryRepo.bulkCreate(categoriesData);

      testValidateCategoriesArrays(created, expected);

      const categories = await categoryRepo.find({
        relations: { parent: true },
      });

      testValidateCategoriesArrays(categories, expected);
    });

    it('should reject to create category when parent category does not exists yet', async () => {
      const categoriesData = TestCategoryData.dataForRepository;
      categoriesData[1].parentId = 3;
      const fn = () => categoryRepo.bulkCreate(categoriesData);
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow(
        CategoryMessage.PARENT_CATEGORY_NOT_FOUND + ': 3',
      );
    });
  });
});
