import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  CannotAttachTreeChildrenEntityError,
  QueryFailedError,
  TreeRepository,
} from 'typeorm';
import { getTestingModule } from '../../../../../.jest/test-config.module';
import {
  testCategoryClosures,
  testCompareCategoryTrees,
  testValidateCategories,
  testValidateCategory,
} from '../../../../../test/category/test-category-utils';
import { CategoryConstants } from '../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../repositories/category.repository';
import { Category } from './category.entity';

describe('CategoryEntity', () => {
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  let categoryTreeRepo: TreeRepository<Category>;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryTreeRepo = module.get<TreeRepository<Category>>(
      getRepositoryToken(Category),
    );
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('create', () => {
    it('should create categories', async () => {
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

      const categories = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_CHILDREN,
          CategoryConstants.CHILDREN,
        )
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .addOrderBy(CategoryConstants.CATEGORY_NAME)
        .addOrderBy(CategoryConstants.CHILDREN_NAME)
        .getMany();

      testValidateCategories(categories, [
        {
          id: c1.id,
          name: 'Category 1',
          active: true,
          parent: null,
          children: [
            { id: c3.id, name: 'Category 3', active: true },
            { id: c4.id, name: 'Category 4', active: true },
          ],
        },
        {
          id: c2.id,
          name: 'Category 2',
          active: true,
          parent: null,
          children: [],
        },
        {
          id: c3.id,
          name: 'Category 3',
          active: true,
          parent: { id: c1.id, name: 'Category 1', active: true },
          children: [{ id: c5.id, name: 'Category 5', active: true }],
        },
        {
          id: c4.id,
          name: 'Category 4',
          active: true,
          parent: { id: c1.id, name: 'Category 1', active: true },
          children: [],
        },
        {
          id: c5.id,
          name: 'Category 5',
          active: true,
          parent: { id: c3.id, name: 'Category 3', active: true },
          children: [],
        },
      ]);

      const closures = await categoryRepo.query(
        'SELECT * FROM categories_closure',
      );
      const expectedClosures = [
        { id_ancestor: c1.id, id_descendant: c1.id },
        { id_ancestor: c2.id, id_descendant: c2.id },
        { id_ancestor: c3.id, id_descendant: c3.id },
        { id_ancestor: c1.id, id_descendant: c3.id },
        { id_ancestor: c4.id, id_descendant: c4.id },
        { id_ancestor: c1.id, id_descendant: c4.id },
        { id_ancestor: c5.id, id_descendant: c5.id },
        { id_ancestor: c3.id, id_descendant: c5.id },
        { id_ancestor: c1.id, id_descendant: c5.id },
      ];
      testCategoryClosures(closures, expectedClosures);
    });

    it('should retrieve category tree', async () => {
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

      const expectedtrees = [
        {
          id: c1.id,
          name: 'Category 1',
          active: true,
          parent: null,
          children: [
            {
              id: c3.id,
              name: 'Category 3',
              active: true,
              parent: { id: c1.id, name: 'Category 1', active: true },
              children: [
                {
                  id: c5.id,
                  name: 'Category 5',
                  active: true,
                  parent: { id: c3.id, name: 'Category 3', active: true },
                  children: [],
                },
              ],
            },
            {
              id: c4.id,
              name: 'Category 4',
              active: true,
              parent: { id: c1.id, name: 'Category 1', active: true },
              children: [],
            },
          ],
        },
        {
          id: c2.id,
          name: 'Category 2',
          active: true,
          parent: null,
          children: [],
        },
      ];

      const trees = await categoryTreeRepo.findTrees({
        relations: ['parent', 'children'],
      });

      expect(trees).toHaveLength(expectedtrees.length);

      for (let i = 0; i < trees.length; i++) {
        testCompareCategoryTrees(expectedtrees[i], trees[i]);
      }
    });

    it('should fail if parent category does not exists', async () => {
      const parentCategory = new Category();

      const childCategory = new Category();
      childCategory.name = 'Category 1';
      childCategory.active = true;
      childCategory.parent = parentCategory;
      const fn = async () => {
        await categoryRepo.save(childCategory);
      };

      await expect(fn).rejects.toThrow(CannotAttachTreeChildrenEntityError);
      await expect(fn).rejects.toThrow(
        `Cannot attach entity \"Category\" to its parent. Please make sure parent is saved in the database before saving children nodes.`,
      );
    });

    it('should fail if parent category does not exists and has id', async () => {
      const parentCategory = new Category();
      parentCategory.id = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';

      const childCategory = new Category();
      childCategory.name = 'Category 1';
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
            .createQueryBuilder(CategoryConstants.CATEGORY)
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
            .createQueryBuilder(CategoryConstants.CATEGORY)
            .getOne();
          expect(category.parent).toBeUndefined();
        });

        it('should accept when parent not defined', async () => {
          await categoryRepo.insert({
            name: 'Category 1',
            active: true,
          });
          const category = await categoryRepo
            .createQueryBuilder(CategoryConstants.CATEGORY)
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
            .createQueryBuilder(CategoryConstants.CATEGORY)
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
            .createQueryBuilder(CategoryConstants.CATEGORY)
            .getOne();
          expect(category.active).toEqual(false);
        });
      });
    });
  });

  describe('find', () => {
    it('should find categories', async () => {
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

      const categories = await categoryRepo.find({
        relations: {
          parent: true,
          children: true,
        },
      });

      testValidateCategories(categories, [
        {
          id: c1.id,
          name: 'Category 1',
          active: true,
          parent: null,
          children: [
            { id: c3.id, name: 'Category 3', active: true },
            { id: c4.id, name: 'Category 4', active: true },
          ],
        },
        {
          id: c2.id,
          name: 'Category 2',
          active: true,
          parent: null,
          children: [],
        },
        {
          id: c3.id,
          name: 'Category 3',
          active: true,
          parent: { id: c1.id, name: 'Category 1', active: true },
          children: [{ id: c5.id, name: 'Category 5', active: true }],
        },
        {
          id: c4.id,
          name: 'Category 4',
          active: true,
          parent: { id: c1.id, name: 'Category 1', active: true },
          children: [],
        },
        {
          id: c5.id,
          name: 'Category 5',
          active: true,
          parent: { id: c3.id, name: 'Category 3', active: true },
          children: [],
        },
      ]);
    });
  });

  describe('find one', () => {
    it('should find one category by id', async () => {
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

      const category = await categoryRepo.findOne({
        where: { id: c3.id },
        relations: { parent: true, children: true },
      });

      testValidateCategory(category, {
        id: c3.id,
        name: 'Category 3',
        active: true,
        parent: { id: c1.id, name: 'Category 1', active: true },
        children: [{ id: c5.id, name: 'Category 5', active: true }],
      });
    });
  });

  describe('soft delete', () => {
    it('should soft delete a category', async () => {
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
      await categoryRepo.softDelete(c3.id);
      const categories = await categoryRepo.find({ withDeleted: true });
      const trees = await categoryTreeRepo.findTrees();
      expect(categories[2].deletedAt).toBeDefined();
      expect(trees[0].children).toHaveLength(1);
      expect(trees[0].children[0].id).toEqual(c4.id);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
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

      await categoryRepo.update(c3.id, {
        name: 'New Name',
        active: false,
        parent: { id: c2.id, name: 'Category 2', active: true },
      });

      const category = await categoryRepo.findOne({
        where: { id: c3.id },
        relations: { parent: true },
      });
      testValidateCategory(category, {
        id: c3.id,
        name: 'New Name',
        active: false,
        parent: { id: c2.id, name: 'Category 2', active: true },
      });
    });

    describe('properties', () => {
      describe('name', () => {
        it('should accept when name is not defined', async () => {
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

          const fn = () => categoryRepo.update(c2.id, {});

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should accept when name is undefined', async () => {
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
          const fn = () => categoryRepo.update(c2.id, { name: undefined });
          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should not update when name is null', async () => {
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

          const fn = () =>
            categoryRepo.update(c2.id, categoryRepo.create({ name: null }));

          await expect(fn()).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: categories.name`,
          );
        });
      });

      describe('active', () => {
        it('should accept when active is not defined', async () => {
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

          const fn = () => categoryRepo.update(c2.id, {});

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should accept when active is undefined', async () => {
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

          const fn = () => categoryRepo.update(c2.id, { active: undefined });

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should not update when active is null', async () => {
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

          const fn = () =>
            categoryRepo.update(c2.id, categoryRepo.create({ active: null }));

          await expect(fn()).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: categories.active`,
          );
        });
      });

      describe('parentId', () => {
        it('should accept when parent is not defined', async () => {
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

          const fn = () => categoryRepo.update(c2.id, {});

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should accept when paparentIdrent is undefined', async () => {
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

          const fn = () => categoryRepo.update(c2.id, { parent: undefined });

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should not update when parentId is already null', async () => {
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

          const fn = () => categoryRepo.update(c2.id, { parent: null });

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
