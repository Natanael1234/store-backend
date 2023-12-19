import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { getTestingModule } from '../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
} from '../../../../test/category/test-category-utils';
import { CategoryMessage } from '../messages/category/category.messages.enum';
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

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  describe('bulkCreate', () => {
    it('should bulk create categories', async () => {
      const created = await categoryRepo.bulkCreate([
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
        { name: 'Category 4', parentPosition: 1 },
      ]);

      const expected = [
        {
          name: 'Category 1',
          active: true,
          parent: null,
        },
        {
          name: 'Category 2',
          active: true,
          parent: { name: 'Category 1', active: true },
        },
        {
          name: 'Category 3',
          active: false,
          parent: { name: 'Category 2', active: true },
        },
        {
          name: 'Category 4',
          active: false,
          parent: { name: 'Category 1', active: true },
        },
      ];

      testValidateCategories(created, expected);

      const categories = await categoryRepo.find({
        relations: { parent: true },
      });

      testValidateCategories(categories, expected);
    });

    describe('category closure', () => {
      describe('getChildrenIds', () => {
        it('should retrieve category children ids filtered by parentIds', async () => {
          const categories = await categoryRepo.bulkCreate([
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: true, parentPosition: 1 },
            { name: 'Category 3', active: true, parentPosition: 1 },
            { name: 'Category 4', active: true, parentPosition: 2 },
            { name: 'Category 5', active: true, parentPosition: 2 },
            { name: 'Category 6', active: true, parentPosition: 3 },
            { name: 'Category 7', active: true, parentPosition: 3 },
            { name: 'Category 8', active: true },
            { name: 'Category 9', active: true, parentPosition: 8 },
            { name: 'Category 10', active: true, parentPosition: 8 },
          ]);
          const descendentIds = await categoryRepo.getChildrenIds([
            categories[0].id,
            categories[1].id,
          ]);
          expect(descendentIds.sort()).toEqual(
            [
              categories[1].id,
              categories[2].id,
              categories[3].id,
              categories[4].id,
            ].sort(),
          );
        });

        it('should retrieve category children ids filtered by null parent', async () => {
          const categories = await categoryRepo.bulkCreate([
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: true, parentPosition: 1 },
            { name: 'Category 3', active: true, parentPosition: 1 },
            { name: 'Category 4', active: true, parentPosition: 2 },
            { name: 'Category 5', active: true, parentPosition: 2 },
            { name: 'Category 6', active: true, parentPosition: 3 },
            { name: 'Category 7', active: true, parentPosition: 3 },
            { name: 'Category 8', active: true },
            { name: 'Category 9', active: true, parentPosition: 8 },
            { name: 'Category 10', active: true, parentPosition: 8 },
          ]);
          const descendentIds = await categoryRepo.getChildrenIds([null]);
          expect(descendentIds.sort()).toEqual(
            [categories[0].id, categories[7].id].sort(),
          );
        });

        it('should retrieve category children ids filtered by parentds ids or null parentId', async () => {
          const categories = await categoryRepo.bulkCreate([
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: true, parentPosition: 1 },
            { name: 'Category 3', active: true, parentPosition: 1 },
            { name: 'Category 4', active: true, parentPosition: 2 },
            { name: 'Category 5', active: true, parentPosition: 2 },
            { name: 'Category 6', active: true, parentPosition: 3 },
            { name: 'Category 7', active: true, parentPosition: 3 },
            { name: 'Category 8', active: true },
            { name: 'Category 9', active: true, parentPosition: 8 },
            { name: 'Category 10', active: true, parentPosition: 8 },
          ]);
          const descendentIds = await categoryRepo.getChildrenIds([
            categories[1].id,
            null,
          ]);
          expect(descendentIds.sort()).toEqual(
            [
              categories[0].id,
              categories[3].id,
              categories[4].id,
              categories[7].id,
            ].sort(),
          );
        });

        it('should retrieve no category children ids when filtering by empty parentId array', async () => {
          const categories = await categoryRepo.bulkCreate([
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: true, parentPosition: 1 },
            { name: 'Category 3', active: true, parentPosition: 1 },
            { name: 'Category 4', active: true, parentPosition: 2 },
            { name: 'Category 5', active: true, parentPosition: 2 },
            { name: 'Category 6', active: true, parentPosition: 3 },
            { name: 'Category 7', active: true, parentPosition: 3 },
            { name: 'Category 8', active: true },
            { name: 'Category 9', active: true, parentPosition: 8 },
            { name: 'Category 10', active: true, parentPosition: 8 },
          ]);
          const descendentIds = await categoryRepo.getChildrenIds([]);
          expect(descendentIds).toEqual([]);
        });

        it('should retrieve no category children ids with null parent when receives parentIds = null', async () => {
          const categories = await categoryRepo.bulkCreate([
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: true, parentPosition: 1 },
            { name: 'Category 3', active: true, parentPosition: 1 },
            { name: 'Category 4', active: true, parentPosition: 2 },
            { name: 'Category 5', active: true, parentPosition: 2 },
            { name: 'Category 6', active: true, parentPosition: 3 },
            { name: 'Category 7', active: true, parentPosition: 3 },
            { name: 'Category 8', active: true },
            { name: 'Category 9', active: true, parentPosition: 8 },
            { name: 'Category 10', active: true, parentPosition: 8 },
          ]);
          const descendentIds = await categoryRepo.getChildrenIds(null);
          expect(descendentIds.sort()).toEqual(
            [categories[0].id, categories[7].id].sort(),
          );
        });

        it('should retrieve no category children ids with null parent when receives parentIds = undefined', async () => {
          const categories = await categoryRepo.bulkCreate([
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: true, parentPosition: 1 },
            { name: 'Category 3', active: true, parentPosition: 1 },
            { name: 'Category 4', active: true, parentPosition: 2 },
            { name: 'Category 5', active: true, parentPosition: 2 },
            { name: 'Category 6', active: true, parentPosition: 3 },
            { name: 'Category 7', active: true, parentPosition: 3 },
            { name: 'Category 8', active: true },
            { name: 'Category 9', active: true, parentPosition: 8 },
            { name: 'Category 10', active: true, parentPosition: 8 },
          ]);
          const descendentIds = await categoryRepo.getChildrenIds(undefined);
          expect(descendentIds.sort()).toEqual(
            [categories[0].id, categories[7].id].sort(),
          );
        });

        it('should retrieve no category children ids when no category registers are found', async () => {
          const descendentIds = await categoryRepo.getChildrenIds([
            uuidv4(),
            uuidv4(),
            uuidv4(),
          ]);
          expect(descendentIds).toEqual([]);
        });

        it.skip('should retrieve no category children ids when no category register is soft-deleted', async () => {});
      });
    });

    it('should reject to create when parent category does not exists yet', async () => {
      const fn = () =>
        categoryRepo.bulkCreate([
          { name: 'Category 1', active: true },
          { name: 'Category 2', active: true, parentPosition: 1 },
          { name: 'Category 3', active: false, parentPosition: 2 },
          {
            name: 'Category 4',
            parentId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
          },
        ]);
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow(
        CategoryMessage.PARENT_CATEGORY_NOT_FOUND +
          ': f136f640-90b7-11ed-a2a0-fd911f8f7f38',
      );
    });
  });
});
