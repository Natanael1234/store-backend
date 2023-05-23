import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  CannotAttachTreeChildrenEntityError,
  QueryFailedError,
  TreeRepository,
} from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestCategoryData } from '../../../../test/category/test-category-data';
import {
  testCompareCategoryTrees,
  testValidateCategoryEntity,
} from '../../../../test/category/test-category-utils';
import { CategoryRepository } from '../../repositories/categoy.repository';
import { CategoryEntity } from './category.entity';

describe('CategoryEntity', () => {
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  let categoryTreeRepo: TreeRepository<CategoryEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryTreeRepo = module.get<TreeRepository<CategoryEntity>>(
      getRepositoryToken(CategoryEntity),
    );
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('create', () => {
    it('should create categories', async () => {
      await TestCategoryData.createCategoriesViaRepository(categoryRepo);
      const expectedResults = TestCategoryData.getExpectedResults();

      const categories = await categoryRepo.find({
        relations: {
          parent: true,
          children: true,
        },
      });

      expect(categories).toHaveLength(5);
      expect(Array.isArray(categories)).toBe(true);
      testValidateCategoryEntity(expectedResults[0], categories[0]);
      testValidateCategoryEntity(expectedResults[1], categories[1]);
      testValidateCategoryEntity(expectedResults[2], categories[2]);
      testValidateCategoryEntity(expectedResults[3], categories[3]);
      testValidateCategoryEntity(expectedResults[4], categories[4]);

      const closure = await categoryRepo.query(
        'SELECT * FROM categories_closure',
      );
      expect(closure).toEqual([
        { id_ancestor: 1, id_descendant: 1 },
        { id_ancestor: 2, id_descendant: 2 },
        { id_ancestor: 3, id_descendant: 3 },
        { id_ancestor: 1, id_descendant: 3 },
        { id_ancestor: 4, id_descendant: 4 },
        { id_ancestor: 1, id_descendant: 4 },
        { id_ancestor: 5, id_descendant: 5 },
        { id_ancestor: 3, id_descendant: 5 },
        { id_ancestor: 1, id_descendant: 5 },
      ]);
    });

    it('should retrieve category tree', async () => {
      await TestCategoryData.createCategoriesViaRepository(categoryRepo);

      const expectedtrees = TestCategoryData.getExpectedTrees();
      const trees = await categoryTreeRepo.findTrees({
        relations: ['parent', 'children'],
      });

      expect(trees).toHaveLength(expectedtrees.length);

      for (let i = 0; i < trees.length; i++) {
        testCompareCategoryTrees(expectedtrees[i], trees[i]);
      }
    });

    it('should fail if parent category does not exists', async () => {
      const parentCategory = new CategoryEntity();

      const childCategory = new CategoryEntity();
      childCategory.name = 'Clothing';
      childCategory.active = true;
      childCategory.parent = parentCategory;
      const fn = async () => {
        await categoryRepo.save(childCategory);
      };

      await expect(fn).rejects.toThrow(CannotAttachTreeChildrenEntityError);
      await expect(fn).rejects.toThrow(
        `Cannot attach entity \"CategoryEntity\" to its parent. Please make sure parent is saved in the database before saving children nodes.`,
      );
    });

    it('should fail if parent category does not exists and has id', async () => {
      const parentCategory = new CategoryEntity();
      parentCategory.id = 100;

      const childCategory = new CategoryEntity();
      childCategory.name = 'Clothing';
      childCategory.active = true;
      childCategory.parent = parentCategory;
      const fn = async () => {
        await categoryRepo.save(childCategory);
      };

      await expect(fn).rejects.toThrow(QueryFailedError);
      await expect(fn).rejects.toThrow(
        `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`,
      );
    });

    describe('properties', () => {
      describe('parent', () => {
        it('should accept when parent is null', async () => {
          await categoryRepo.insert(
            categoryRepo.create({
              name: 'Category 1',
              active: true,
              parent: null,
            }),
          );
          const category = await categoryRepo
            .createQueryBuilder('category')
            .getOne();
          expect(category.parent).toBeUndefined();
        });

        it('should accept when parent is undefined', async () => {
          await categoryRepo.insert(
            categoryRepo.create({
              name: 'Category 1',
              active: true,
              parent: undefined,
            }),
          );
          const category = await categoryRepo
            .createQueryBuilder('category')
            .getOne();
          expect(category.parent).toBeUndefined();
        });

        it('should accept when parent not defined', async () => {
          await categoryRepo.insert({
            name: 'Category 1',
            active: true,
          });
          const category = await categoryRepo
            .createQueryBuilder('category')
            .getOne();
          expect(category.parent).toBeUndefined();
        });
      });

      describe('name', () => {
        it(`should fail when name is not defined`, async () => {
          const fn = async () => {
            await categoryRepo.insert({
              active: true,
              parent: null,
            });
          };
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: categories.name`,
          );
        });

        it(`should fail when name is null`, async () => {
          const fn = async () => {
            await categoryRepo.insert({
              name: null,
              active: true,
              parent: null,
            });
          };
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: categories.name`,
          );
        });

        it(`should fail when name is undefined`, async () => {
          const fn = async () => {
            await categoryRepo.insert({
              name: undefined,
              active: true,
              parent: null,
            });
          };
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: categories.name`,
          );
        });
      });

      describe('active', () => {
        it('should accept when active is not defined and set active as false by default', async () => {
          await categoryRepo.insert({
            name: 'Category 1',
            parent: null,
          });
          const category = await categoryRepo
            .createQueryBuilder('category')
            .getOne();
          expect(category.active).toEqual(false);
        });

        it('should accept when active is null and set active as false by default', async () => {
          const fn = () =>
            categoryRepo.insert({
              name: 'Category 1',
              active: null,
              parent: null,
            });
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: categories.active`,
          );
        });

        it('should accept when active is undefined and set active as false by default', async () => {
          await categoryRepo.insert({
            name: 'Category 1',
            active: undefined,
            parent: null,
          });
          const category = await categoryRepo
            .createQueryBuilder('category')
            .getOne();
          expect(category.active).toEqual(false);
        });
      });
    });
  });

  describe('find', () => {
    it('should find categories', async () => {
      await TestCategoryData.createCategoriesViaRepository(categoryRepo);
      const expectedResults = TestCategoryData.getExpectedResults();
      const categories = await categoryRepo.find({
        relations: {
          parent: true,
          children: true,
        },
      });

      expect(categories).toHaveLength(5);
      for (let i = 0; i < expectedResults.length; i++) {
        testValidateCategoryEntity(expectedResults[i], categories[i]);
      }
    });
  });

  describe('find one', () => {
    it('should find one category by id', async () => {
      await TestCategoryData.createCategoriesViaRepository(categoryRepo);
      const expectedResult = TestCategoryData.getExpectedResults()[2];
      const category = await categoryRepo.findOne({
        where: { id: 3 },
        relations: {
          parent: true,
          children: true,
        },
      });
      testValidateCategoryEntity(expectedResult, category);
    });
  });

  describe('soft delete', () => {
    it('should soft delete a category', async () => {
      await TestCategoryData.createCategoriesViaRepository(categoryRepo);
      await categoryRepo.softDelete(3);
      const categories = await categoryRepo.find({ withDeleted: true });
      const trees = await categoryTreeRepo.findTrees();
      expect(categories[2].deletedAt).toBeDefined();
      expect(trees[0].children).toHaveLength(1);
      expect(trees[0].children[0].id).toEqual(4);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const createdRegisters =
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);

      await categoryRepo.update(3, {
        name: 'New Name',
        active: false,
        parent: createdRegisters[1],
      });
      const category = await categoryRepo.findOne({
        where: { id: 3 },
        relations: { parent: true },
      });

      expect(category.name).toEqual('New Name');
      expect(category.active).toEqual(false);
      expect(category.parent.id).toEqual(2);
    });

    describe('properties', () => {
      describe('name', () => {
        it('should accept when name is not defined', async () => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);

          const fn = () => categoryRepo.update(2, {});

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should accept when name is undefined', async () => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);
          const fn = () => categoryRepo.update(2, { name: undefined });
          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should not update when name is null', async () => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);

          const fn = () =>
            categoryRepo.update(2, categoryRepo.create({ name: null }));

          await expect(fn()).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: categories.name`,
          );
        });
      });

      describe('active', () => {
        it('should accept when active is not defined', async () => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);

          const fn = () => categoryRepo.update(2, {});

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should accept when active is undefined', async () => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);

          const fn = () => categoryRepo.update(2, { active: undefined });

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should not update when active is null', async () => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);

          const fn = () =>
            categoryRepo.update(2, categoryRepo.create({ active: null }));

          await expect(fn()).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: categories.active`,
          );
        });
      });

      describe('parentId', () => {
        it('should accept when parent is not defined', async () => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);

          const fn = () => categoryRepo.update(2, {});

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should accept when paparentIdrent is undefined', async () => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);

          const fn = () => categoryRepo.update(2, { parent: undefined });

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should not update when parentId is null', async () => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);

          const fn = () => categoryRepo.update(2, { parent: null });

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });
      });
    });
  });
});
