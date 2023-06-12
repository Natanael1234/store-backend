import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../.jest/test-config.module';
import { TestCategoryData } from '../../../test/category/test-category-data';
import { testValidateCategoriesArrays } from '../../../test/category/test-category-utils';
import { CategoryMessage } from '../enums/messages/category-messages/category-messages.enum';
import { CategoryRepository } from './category.repository';

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

    describe('category closure', () => {
      describe('getChildrenIds', () => {
        async function createTestScenario() {
          await categoryRepo.bulkCreate([
            { name: 'Category 1', active: true, parentId: null },
            { name: 'Category 2', active: true, parentId: 1 },
            { name: 'Category 3', active: true, parentId: 1 },
            { name: 'Category 4', active: true, parentId: 2 },
            { name: 'Category 5', active: true, parentId: 2 },
            { name: 'Category 6', active: true, parentId: 3 },
            { name: 'Category 7', active: true, parentId: 3 },
            { name: 'Category 8', active: true, parentId: null },
            { name: 'Category 9', active: true, parentId: 8 },
            { name: 'Category 10', active: true, parentId: 8 },
          ]);
        }

        it('should retrieve category children ids filtered by parendIds', async () => {
          await createTestScenario();
          const descendentIds = await categoryRepo.getChildrenIds([1, 2]);
          expect(descendentIds).toEqual([2, 3, 4, 5]);
        });

        it('should retrieve category children ids filtered by null parent', async () => {
          await createTestScenario();
          const descendentIds = await categoryRepo.getChildrenIds([null]);
          expect(descendentIds).toEqual([1, 8]);
        });

        it('should retrieve category children ids filtered by parentds ids or null parendId', async () => {
          await createTestScenario();
          const descendentIds = await categoryRepo.getChildrenIds([2, null]);
          expect(descendentIds).toEqual([1, 4, 5, 8]);
        });

        it('should retrieve no category children ids when filtering by empty parentId array', async () => {
          await createTestScenario();
          const descendentIds = await categoryRepo.getChildrenIds([]);
          expect(descendentIds).toEqual([]);
        });

        it('should retrieve no category children ids with null parent when receives parentIds = null', async () => {
          await createTestScenario();
          const descendentIds = await categoryRepo.getChildrenIds(null);
          expect(descendentIds).toEqual([1, 8]);
        });

        it('should retrieve no category children ids with null parent when receives parentIds = undefined', async () => {
          await createTestScenario();
          const descendentIds = await categoryRepo.getChildrenIds(undefined);
          expect(descendentIds).toEqual([1, 8]);
        });

        it('should retrieve no category children ids when no category registers are found', async () => {
          const descendentIds = await categoryRepo.getChildrenIds([1, 2, 3]);
          expect(descendentIds).toEqual([]);
        });

        it.skip('should retrieve no category children ids when no category register is soft-deleted', async () => {});
      });
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
