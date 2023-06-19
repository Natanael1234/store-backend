import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { FindManyOptions, ILike, In, IsNull, Not } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestCategoryData } from '../../../../test/category/test-category-data';
import { AbstractTestServiceActiveFilter } from '../../../../test/filtering/active/test-service-active-filter';
import { AbstractTestServiceDeletedFilter } from '../../../../test/filtering/deleted/test-service-deleted-filter';
import { AbestractTestServicePagination } from '../../../../test/filtering/pagination/test-service-pagination-filter';
import { TestSortScenarioBuilder } from '../../../../test/filtering/sort/test-service-sort-filter';
import { AbstractTestServiceTextFilter } from '../../../../test/filtering/text/test-service-text-filter';
import { TestPurpose } from '../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../test/test-data/test-active-data';
import {
  getNameAcceptableValues,
  getNameErrorDataList,
} from '../../../../test/test-data/test-name-data';
import { PaginationConfig } from '../../../system/dtos/request/pagination/configs/pagination.config';
import { SortConfig } from '../../../system/dtos/request/sort/configs/sort.config';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';

import { CategoryMessage } from '../../enums/messages/category-messages/category-messages.enum';

import {
  testValidateCategoriesArrays,
  testValidateCategory,
} from '../../../../test/category/test-category-utils';
import { CategoryOrder } from '../../enums/sort/category-order/category-order.enum';
import { CategoryEntity } from '../../models/category/category.entity';

import { TestDtoIdListFilter } from '../../../../test/filtering/id-list-filter/test-dto-id-list-filter';
import { getFKErrorDataList } from '../../../../test/test-data/test-fk-data';
import { CreateCategoryRequestDTO } from '../../controllers/category/dtos/request/create-category/create-category.request.dto';
import { FindCategoriesRequestDTO } from '../../controllers/category/dtos/request/find-categories/find-categories.request.dto';
import { UpdateCategoryRequestDTO } from '../../controllers/category/dtos/request/update-category/update-category.request.dto';
import { CategoryRepository } from '../../repositories/category.repository';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  // let categoryRepo: Repository<CategoryEntity>;
  let categoryRepo: CategoryRepository;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryService = module.get<CategoryService>(CategoryService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  describe('create', () => {
    it('should create category', async () => {
      const categoriesDTOs = TestCategoryData.getServiceCreationCategoryData();
      const expectedResults = TestCategoryData.getExpectedResults();
      const createdCategories = [
        await categoryService.create(categoriesDTOs[0]),
        await categoryService.create(categoriesDTOs[1]),
        await categoryService.create(categoriesDTOs[2]),
        await categoryService.create(categoriesDTOs[3]),
        await categoryService.create(categoriesDTOs[4]),
      ];

      const repositoryCategory = await categoryRepo.find({
        relations: { parent: true },
      });
      expect(repositoryCategory).toHaveLength(5);
      testValidateCategoriesArrays(repositoryCategory, expectedResults);
    });

    describe.each([
      ...getNameErrorDataList({
        dtoData: TestCategoryData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
      ...getActiveErrorDataList({
        dtoData: TestCategoryData.dataForRepository[1],
      }),
    ])(
      '$property',
      ({ data, ExceptionClass, response, property, description }) => {
        it(`should reject create category when ${property} is ${description}`, async () => {
          const categoryDto = plainToInstance(CreateCategoryRequestDTO, data);
          const fn = () => categoryService.create(categoryDto);
          await expect(fn()).rejects.toThrow(ExceptionClass);
          expect(await categoryRepo.count()).toEqual(0);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual(response);
          }
        });
      },
    );

    describe.each([
      ...getNameAcceptableValues({
        dtoData: TestCategoryData.dataForRepository[0],
        purpose: TestPurpose.create,
      }),
      ...getActiveAcceptableValues({
        dtoData: TestCategoryData.dataForRepository[0],
      }),
    ])('$property', ({ property, data, description }) => {
      it(`should accpet create category when ${property} is ${description}`, async () => {
        const categoryDto = plainToInstance(CreateCategoryRequestDTO, data);
        const expectedResult = { id: 1, ...data, active: categoryDto.active };
        const createdCategory = await categoryService.create(categoryDto);
        // expectedResult.active = categoryDto.active;
        testValidateCategory(createdCategory, expectedResult);
        const categories = await categoryRepo.find({
          relations: { parent: true },
        });
        testValidateCategoriesArrays(categories, [expectedResult]);
      });
    });

    describe('parentId', () => {
      it(`should accept create category when parentId is minimum allowed`, async () => {
        const data = [
          { name: 'Category 1', active: true },
          { name: 'Category 2', active: false, parentId: 1 },
        ];

        const created = [
          await categoryService.create(data[0] as CreateCategoryRequestDTO),
          await categoryService.create(data[1] as CreateCategoryRequestDTO),
        ];

        const expectedResults = [
          {
            id: 1,
            name: 'Category 1',
            active: true,
            parent: null,
          },
          {
            id: 2,
            name: 'Category 2',
            active: false,
            parent: { id: 1, name: 'Category 1', active: true },
          },
        ];

        testValidateCategoriesArrays(created, expectedResults);

        const categories = await categoryRepo.find({
          relations: { parent: true },
          order: { id: 'ASC' },
        });
        testValidateCategoriesArrays(categories, expectedResults);
      });

      it.each([
        { description: 'null', parentId: null },
        { description: 'undefined', parentId: undefined },
      ])(
        `should accept to create category when parentId is minimum $description`,
        async ({ parentId }) => {
          const data = [
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: false, parentId },
          ];

          const created = [
            await categoryService.create(data[0] as CreateCategoryRequestDTO),
            await categoryService.create(data[1] as CreateCategoryRequestDTO),
          ];

          const expectedResults = [
            { id: 1, name: 'Category 1', active: true, parent: null },
            { id: 2, name: 'Category 2', active: false, parent: null },
          ];

          testValidateCategoriesArrays(created, expectedResults);

          const categories = await categoryRepo.find({
            relations: { parent: true },
            order: { id: 'ASC' },
          });
          testValidateCategoriesArrays(categories, expectedResults);
        },
      );

      const rejects = getFKErrorDataList({
        property: 'parentId',
        dtoData: TestCategoryData.dataForRepository[1],
        allowUndefined: true,
        allowNull: true,
        messages: {
          invalid: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
          type: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
          undefined: CategoryMessage.REQUIRED_PARENT_CATEGORY_ID,
          null: CategoryMessage.NULL_PARENT_CATEGORY_ID,
        },
      });
      it.each(rejects)(
        `should reject create category when parentId is $description`,
        async ({ data, ExceptionClass, response }) => {
          const categoriesData = TestCategoryData.dataForRepository;
          await categoryRepo.bulkCreate([categoriesData[0]]);

          const categoriesBefore = await categoryRepo.find();
          const fn = () => categoryService.create(data);
          await expect(fn()).rejects.toThrow(ExceptionClass);
          const categoriesAfter = await categoryRepo.find();
          expect(categoriesBefore).toStrictEqual(categoriesAfter);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual(response);
          }
        },
      );

      it(`should reject create category when parentId is not found`, async () => {
        const categoriesData = TestCategoryData.dataForRepository;
        await categoryRepo.bulkCreate([categoriesData[0]]);
        const data = {
          name: 'New Name',
          active: true,
          parentId: 200,
        };

        const categoriesBefore = await categoryRepo.find();
        const fn = () => categoryService.create(data);
        await expect(fn()).rejects.toThrow(NotFoundException);
        const categoriesAfter = await categoryRepo.find();
        expect(categoriesBefore).toStrictEqual(categoriesAfter);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Not Found',
            message: CategoryMessage.PARENT_CATEGORY_NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
          });
        }
      });
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      await TestCategoryData.createCategoriesViaRepository(categoryRepo);
      const categoriesBefore = await categoryRepo.find({
        relations: { parent: true },
        order: { id: 'ASC' },
      });
      const [clothing, appliances, mensClothing, womensCloting, mensShirt] =
        await categoriesBefore;

      mensClothing.name = 'New Name';
      mensClothing.active = false;
      mensClothing.parent = appliances;
      mensShirt.parent.name = mensClothing.name;
      mensShirt.parent.active = mensClothing.active;

      const categoryDto = new UpdateCategoryRequestDTO();
      categoryDto.name = mensClothing.name;
      categoryDto.active = !!mensClothing.active;
      categoryDto.parentId = appliances.id;

      // prevents updated times to be the same
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedCategory = await categoryService.update(
        mensClothing.id,
        categoryDto,
      );

      const categoriesAfter = await categoryRepo.find({
        relations: { parent: true },
        order: { id: 'ASC' },
      });

      testValidateCategoriesArrays(categoriesBefore, categoriesAfter);
    });

    describe('name', () => {
      const accepts = getNameAcceptableValues({
        dtoData: TestCategoryData.dataForRepository[1],
        purpose: TestPurpose.update,
      });

      it.each(accepts)(
        `should accept update category when name is $description`,
        async ({ data }) => {
          await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
          const expected = await categoryRepo.find({
            relations: { parent: true },
          });
          if (data.name !== undefined) {
            expected[1].name = data.name;
            expected[2].parent.name = data.name;
          }
          const dto = plainToInstance(UpdateCategoryRequestDTO, data);
          const updated = await categoryService.update(2, dto);
          if (dto.name !== undefined) expected[1].name = dto.name;
          const after = await categoryRepo.find({
            relations: { parent: true },
          });
          testValidateCategory(updated, expected[1]);
          expect(after).toHaveLength(4);
          testValidateCategoriesArrays(after, expected);
        },
      );

      const rejects = getNameErrorDataList({
        dtoData: TestCategoryData.dataForRepository[1],
        purpose: TestPurpose.update,
      });

      it.each(rejects)(
        `should reject update category when name is $description`,
        async ({ data, ExceptionClass, response }) => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);
          const categoryDto = plainToInstance(UpdateCategoryRequestDTO, data);

          const categoriesBefore = await categoryRepo.find();
          const fn = () => categoryService.update(2, categoryDto);
          await expect(fn()).rejects.toThrow(ExceptionClass);
          const categoriesAfter = await categoryRepo.find();
          expect(categoriesBefore).toStrictEqual(categoriesAfter);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual(response);
          }
        },
      );
    });

    describe('active', () => {
      const accepts = getActiveAcceptableValues({ dtoData: {} });
      it.each(accepts)(
        `should accept update category when active is $description`,
        async ({ data }) => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);
          const expected = await TestCategoryData.getExpectedResults();
          const dto = plainToInstance(UpdateCategoryRequestDTO, data);
          if (data.active !== undefined) {
            expected[1].active = dto.active;
          }
          const updated = await categoryService.update(2, dto);

          const after = await categoryRepo.find({
            relations: { parent: true },
          });
          testValidateCategory(updated, expected[1]);
          testValidateCategoriesArrays(after, expected);
        },
      );

      const rejects = getActiveErrorDataList({
        dtoData: TestCategoryData.dataForRepository[1],
      });
      it.each(rejects)(
        `should reject update category when active is $description`,
        async ({ data, ExceptionClass, response }) => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);
          const categoryDto = plainToInstance(UpdateCategoryRequestDTO, data);

          const categoriesBefore = await categoryRepo.find();
          const fn = () => categoryService.update(2, categoryDto);
          await expect(fn()).rejects.toThrow(ExceptionClass);
          const categoriesAfter = await categoryRepo.find();
          expect(categoriesBefore).toStrictEqual(categoriesAfter);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual(response);
          }
        },
      );
    });

    describe('parentId', () => {
      it(`should accept update category when parentId is minimum allowed`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);

        const id = 2;
        const name = 'New Name';
        const active = false;
        const parentId = 1;

        const expected = await TestCategoryData.getExpectedResults();
        expected[1].name = name;
        expected[1].active = active;
        expected[1].parent = expected[0];

        const dto = plainToInstance(UpdateCategoryRequestDTO, {
          name,
          active,
          parentId,
        });

        const updated = await categoryService.update(2, dto);

        testValidateCategory(updated, expected[1]);

        const categories = await categoryRepo.find({
          relations: { parent: true },
          order: { id: 'ASC' },
        });

        testValidateCategoriesArrays(categories, expected);
      });

      it(`should accept update category when parentId is null`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);

        const id = 2;
        const name = 'New Name';
        const active = false;
        const parentId = null;

        const expected = await TestCategoryData.getExpectedResults();
        expected[1].name = name;
        expected[1].active = active;
        expected[1].parent = null;

        const dto = plainToInstance(UpdateCategoryRequestDTO, {
          name,
          active,
          parentId,
        });

        const updated = await categoryService.update(2, dto);

        testValidateCategory(updated, expected[1]);

        const categories = await categoryRepo.find({
          relations: { parent: true },
          order: { id: 'ASC' },
        });

        testValidateCategoriesArrays(categories, expected);
      });

      it(`should accept update category when parentId is undefined`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);

        const id = 2;
        const name = 'New Name';
        const active = false;
        const parentId = undefined;

        const expected = await TestCategoryData.getExpectedResults();
        expected[1].name = name;
        expected[1].active = active;

        const dto = plainToInstance(UpdateCategoryRequestDTO, {
          name,
          active,
          parentId,
        });

        const updated = await categoryService.update(2, dto);

        testValidateCategory(updated, expected[1]);

        const categories = await categoryRepo.find({
          relations: { parent: true },
          order: { id: 'ASC' },
        });

        testValidateCategoriesArrays(categories, expected);
      });

      const rejects = getFKErrorDataList({
        property: 'parentId',
        dtoData: TestCategoryData.dataForRepository[1],
        allowUndefined: true,
        allowNull: true,
        messages: {
          invalid: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
          type: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
          undefined: CategoryMessage.REQUIRED_PARENT_CATEGORY_ID,
          null: CategoryMessage.NULL_PARENT_CATEGORY_ID,
        },
      });
      it.each(rejects)(
        `should reject update category when parentId is $description`,
        async ({ data, ExceptionClass, response }) => {
          await TestCategoryData.createCategoriesViaRepository(categoryRepo);
          const categoryDto = plainToInstance(UpdateCategoryRequestDTO, data);

          const categoriesBefore = await categoryRepo.find();
          const fn = () => categoryService.update(2, categoryDto);
          await expect(fn()).rejects.toThrow(ExceptionClass);
          const categoriesAfter = await categoryRepo.find();
          expect(categoriesBefore).toStrictEqual(categoriesAfter);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual(response);
          }
        },
      );

      it(`should reject update category when parent category is not found`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);
        const data = {
          name: 'New Name',
          active: true,
          parentId: 200,
        };
        const categoryDto = plainToInstance(UpdateCategoryRequestDTO, data);

        const categoriesBefore = await categoryRepo.find();
        const fn = () => categoryService.update(2, categoryDto);
        await expect(fn()).rejects.toThrow(NotFoundException);
        const categoriesAfter = await categoryRepo.find();
        expect(categoriesBefore).toStrictEqual(categoriesAfter);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Not Found',
            message: CategoryMessage.PARENT_CATEGORY_NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
          });
        }
      });

      it(`should reject update category when parent category is the same category being updated`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);
        const data = {
          name: 'New Name',
          active: true,
          parentId: 2,
        };
        const categoryDto = plainToInstance(UpdateCategoryRequestDTO, data);

        const categoriesBefore = await categoryRepo.find();
        const fn = () => categoryService.update(2, categoryDto);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const categoriesAfter = await categoryRepo.find();
        expect(categoriesBefore).toStrictEqual(categoriesAfter);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Unprocessable Entity',
            message: CategoryMessage.CANNOT_PARENT_ITSELF,
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
      });

      it(`should reject update category when parent category is descendent of the category being updated`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);
        const data = {
          name: 'New Name',
          active: true,
          parentId: 4,
        };
        const categoryDto = plainToInstance(UpdateCategoryRequestDTO, data);

        const categoriesBefore = await categoryRepo.find();
        const fn = () => categoryService.update(1, categoryDto);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const categoriesAfter = await categoryRepo.find();
        expect(categoriesBefore).toStrictEqual(categoriesAfter);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Unprocessable Entity',
            message: CategoryMessage.CANNOT_DESCEND_FROM_ITSELF,
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
      });
    });
  });

  describe('find', () => {
    it('should find categories without parameters and pagination dtos', async () => {
      const categoryData: any = TestCategoryData.buildData(15);
      categoryData[3].active = false;
      categoryData[5].deletedAt = new Date();
      await categoryRepo.insert(categoryData);
      const categories = await categoryRepo.find({
        where: { active: true },
        skip: 0,
        take: PaginationConfig.DEFAULT_PAGE_SIZE,
        order: { name: SortConfig.DEFAULT_ORDER_DIRECTION },
        relations: { parent: true },
      });

      const ret = await categoryService.find({});

      expect(ret).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: categories,
      });
    });

    it('should return parents', async () => {
      await TestCategoryData.createCategoriesViaRepository(categoryRepo);
      const expectedResults = TestCategoryData.getExpectedResults();

      const categories = await categoryRepo.find({
        where: { active: true },
        skip: 0,
        take: PaginationConfig.DEFAULT_PAGE_SIZE,
        order: { name: SortConfig.DEFAULT_ORDER_DIRECTION },
        relations: { parent: true },
      });

      const ret = await categoryService.find({});

      expect(ret).toEqual({
        count: 5,
        page: 1,
        pageSize: 12,
        results: categories,
      });
    });

    it('should return empty list', async () => {
      const categoriesBefore = await categoryRepo.find();

      const ret = await categoryService.find();

      expect(await categoryRepo.find()).toHaveLength(0);
      expect(categoriesBefore).toHaveLength(0);
      expect(ret.results).toHaveLength(0);
      expect(ret.count).toEqual(0);
      expect(ret.page).toEqual(1);
      expect(ret.pageSize).toEqual(12);
    });

    describe('query parameters', () => {
      it.each([
        { description: 'null', data: null },
        { description: 'undefined', data: undefined },
      ])(
        'should use default values when "filtering" is $description',
        async ({ data }) => {
          const categoryData = TestCategoryData.buildData(3);
          categoryData[2].active = false;
          await categoryRepo.insert(categoryData);
          const categories = await categoryRepo.find({
            where: { active: true },
            order: { name: 'ASC' },
            relations: { parent: true },
          });

          const results = await categoryService.find(data);

          expect(results).toEqual({
            count: 2,
            page: 1,
            pageSize: 12,
            results: categories,
          });
        },
      );

      describe('text query', () => {
        class TestServiceTextFilter extends AbstractTestServiceTextFilter<CategoryEntity> {
          async insertViaRepository(texts: string[]) {
            const categoriesData: any = TestCategoryData.buildData(
              texts.length,
            );
            for (let i = 0; i < categoriesData.length; i++) {
              categoriesData[i].name = texts[i];
            }
            await categoryRepo.insert(categoriesData);
          }

          findViaRepository(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            findManyOptions.relations = { parent: true };
            return categoryRepo.findAndCount(findManyOptions);
          }

          findViaService(queryParams?: FindCategoriesRequestDTO) {
            return categoryService.find(queryParams);
          }
        }

        new TestServiceTextFilter().executeTests();
      });

      describe('active', () => {
        class TestUserServiceActive extends AbstractTestServiceActiveFilter<CategoryEntity> {
          async insertRegisters(active: boolean[]) {
            const insertData: any = await TestCategoryData.buildData(
              active.length,
            );
            for (let i = 0; i < active.length; i++) {
              insertData[i].active = active[i];
            }
            await categoryRepo.insert(insertData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            findManyOptions.relations = { parent: true };
            return categoryRepo.findAndCount(findManyOptions);
          }

          findViaService(queryParams?: FindCategoriesRequestDTO) {
            return categoryService.find(queryParams);
          }
        }

        new TestUserServiceActive().executeTests();
      });

      describe('deleted', () => {
        class TestServiceDeleted extends AbstractTestServiceDeletedFilter<CategoryEntity> {
          async insertRegisters(deleted: boolean[]) {
            const insertData: any = await TestCategoryData.buildData(
              deleted.length,
            );
            for (let i = 0; i < deleted.length; i++) {
              insertData[i].deletedAt = !!deleted[i] ? new Date() : null;
            }
            await categoryRepo.insert(insertData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            findManyOptions.relations = { parent: true };
            return categoryRepo.findAndCount(findManyOptions);
          }

          findViaService(queryParams?: FindCategoriesRequestDTO) {
            return categoryService.find(queryParams);
          }
        }

        new TestServiceDeleted().executeTests();
      });

      describe('parentId', () => {
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

        it('should filter categories by parentIds', async () => {
          await createTestScenario();
          const expectedResults = await categoryRepo.find({
            where: { id: In([2, 3, 4, 5]) },
            relations: { parent: true },
          });
          const serviceCategories = await categoryService.find({
            active: ActiveFilter.ALL,
            parentIds: [1, 2],
          });
          expect(serviceCategories).toEqual({
            count: 4,
            page: 1,
            pageSize: 12,
            results: expectedResults,
          });
          expect(serviceCategories.results).toEqual(expectedResults);
        });

        it('should filter categories by null parent', async () => {
          await createTestScenario();
          const expectedResults = await categoryRepo.find({
            where: { id: In([1, 8]) },
            relations: { parent: true },
          });
          try {
            const serviceCategories = await categoryService.find({
              active: ActiveFilter.ALL,
              parentIds: [null],
            });
            expect(serviceCategories).toEqual({
              count: 2,
              page: 1,
              pageSize: 12,
              results: expectedResults,
            });
            expect(serviceCategories.results).toEqual(expectedResults);
          } catch (error) {
            throw error;
          }
        });

        const idlistTests = new TestDtoIdListFilter({
          messages: {
            propertyLabel: 'parentId',
            invalidMessage: CategoryMessage.INVALID_PARENT_CATEGORY_ID_LIST,
            invalidItemMessage:
              CategoryMessage.INVALID_PARENT_CATEGORY_ID_LIST_ITEM,
            requiredItemMessage:
              CategoryMessage.NULL_PARENT_CATEGORY_ID_LIST_ITEM,
          },
          customOptions: {
            description: 'category parent options',
            allowUndefined: true,
            allowNull: true,
            allowNullItem: true,
          },
        });
        const { accepts, rejects } = idlistTests.getTestData();

        it.each(accepts)('$description', async ({ test }) => {
          await createTestScenario();
          const categories = (
            await categoryRepo.find({ relations: { parent: true } })
          ).filter((category) => {
            if (test.normalizedData?.length) {
              if (category.parent) {
                return test.normalizedData.includes(category.parent.id);
              } else {
                return (
                  test.normalizedData.includes(null) ||
                  test.normalizedData.includes(undefined)
                );
              }
            }
            return true;
          });

          const results = await categoryService.find({
            active: ActiveFilter.ACTIVE,
            parentIds: test.data,
            orderBy: [CategoryOrder.ACTIVE_DESC],
          });

          expect(results).toEqual({
            count: categories.length,
            page: 1,
            pageSize: 12,
            results: categories,
          });
        });

        it.each(rejects)('$description', async (optionTest) => {
          const test = optionTest.test;
          const message = optionTest.message;

          await createTestScenario();
          const fn = () =>
            categoryService.find({
              active: ActiveFilter.ACTIVE,
              parentIds: test.data,
              orderBy: [CategoryOrder.ACTIVE_DESC],
            });

          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual({
              error: 'UnprocessableEntityException',
              message: {
                parentIds: message,
              },
              statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            });
          }
        });
      });

      describe('pagination', () => {
        class TestCategoryServicePagination extends AbestractTestServicePagination<CategoryEntity> {
          async insertViaRepository(quantity: number) {
            await categoryRepo.insert(TestCategoryData.buildData(quantity));
          }

          findViaRepository(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            findManyOptions.relations = { parent: true };
            return categoryRepo.findAndCount(findManyOptions);
          }

          findViaService(queryParams?: FindCategoriesRequestDTO) {
            return categoryService.find(queryParams);
          }
        }

        new TestCategoryServicePagination().executeTests();
      });

      describe('sort', () => {
        const { accepts, rejects } = new TestSortScenarioBuilder<
          typeof CategoryOrder
        >(CategoryOrder, [CategoryOrder.NAME_ASC], 'service').getTests();

        const categoryData = [];
        for (let name of ['Category 1', 'Category 2']) {
          for (let active of [true, false]) {
            for (let i = 1; i <= 2; i++) {
              categoryData.push({ name: name, active });
            }
          }
        }

        it.each(accepts)(
          `should order results when orderBy=$description`,
          async ({ orderBySQL, orderBy }) => {
            // prepare
            await categoryRepo.insert(categoryData);
            const repositoryResults = await categoryRepo.find({
              order: orderBySQL,
              take: PaginationConfig.DEFAULT_PAGE_SIZE,
              relations: { parent: true },
            });

            // execute
            const apiResult = await categoryService.find({
              orderBy: orderBy,
              active: ActiveFilter.ALL,
            });

            // test
            expect(apiResult).toEqual({
              count: 8,
              page: 1,
              pageSize: 12,
              results: repositoryResults,
            });
          },
        );

        it.each(rejects)(
          'should fail when orderBy=$description',
          async ({ orderBy, expectedErrorResult }) => {
            // prepare
            await categoryRepo.insert(categoryData);

            // execute
            const fn = () =>
              categoryService.find({ orderBy, active: ActiveFilter.ALL });

            await expect(fn()).rejects.toThrow(UnprocessableEntityException);

            try {
              await fn();
            } catch (ex) {
              expect(ex.response).toEqual(expectedErrorResult);
            }
          },
        );
      });

      describe('combined tests', () => {
        let categoriesData; //= TestCategoryData.buildData(20);
        beforeEach(async () => {
          categoriesData = [];
          let j = 1;
          for (let i = 0; i < 4; i++) {
            for (let active of [true, false]) {
              for (let deletedAt of [null, new Date()]) {
                for (let text of ['EVEN', 'ODD']) {
                  categoriesData.push({
                    name: `Category ${j++} ${text}`,
                    active,
                    deletedAt,
                  });
                }
              }
            }
          }
          const ret = await categoryRepo.save(categoriesData);
        });

        async function findAndCountCategories(
          query,
          active: ActiveFilter,
          deleted: DeletedFilter,
          page: number,
          pageSize: number,
          order: any,
        ): Promise<{ results: CategoryEntity[]; count: number }> {
          let findManyOptions: any = { where: {} };
          // query
          if (query) {
            findManyOptions.where['name'] = ILike(`%EVEN%`);
          }
          // active
          if (active == ActiveFilter.ACTIVE) {
            findManyOptions.where.active = true;
          } else if (active == ActiveFilter.INACTIVE) {
            findManyOptions.where.active = false;
          }
          // deleted
          if (deleted == DeletedFilter.DELETED) {
            findManyOptions.where.deletedAt = Not(IsNull());
            findManyOptions.withDeleted = true;
          } else if (deleted == DeletedFilter.ALL) {
            findManyOptions.withDeleted = true;
          }
          // sort
          if (order) {
            findManyOptions.order = order;
          }
          findManyOptions.take = pageSize;
          findManyOptions.skip = (page - 1) * pageSize;
          findManyOptions.relations = { parent: true };
          const [results, count] = await categoryRepo.findAndCount(
            findManyOptions,
          );
          return { results, count };
        }

        async function testCombinedParameters(options: {
          active: ActiveFilter;
          deleted: DeletedFilter;
          page: number;
          pageSize: number;
        }) {
          const { active, deleted, page, pageSize } = options;
          const query = 'EVEN';
          const filter = `%EVEN%`;
          const order = { name: 'asc' };
          const { results, count } = await findAndCountCategories(
            filter,
            active,
            deleted,
            page,
            pageSize,
            order,
          );
          const ret = await categoryService.find({
            query,
            active,
            deleted,
            page,
            pageSize,
            orderBy: [CategoryOrder.NAME_ASC],
          });
          expect(ret).toEqual({
            count,
            page,
            pageSize,
            results: results,
          });
        }

        describe.each([
          {
            description: 'active and deleted',
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.DELETED,
            pageSize: 3,
          },
          {
            description: 'active and not deleted',
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            pageSize: 3,
          },
          {
            description: 'active and deleted or not deleted',
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.ALL,
            pageSize: 6,
          },

          {
            description: 'inactive and deleted',
            active: ActiveFilter.INACTIVE,
            deleted: DeletedFilter.DELETED,
            pageSize: 3,
          },
          {
            description: 'inactive and not deleted',
            active: ActiveFilter.INACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            pageSize: 3,
          },
          {
            description: 'inactive and deleted or not deleted',
            active: ActiveFilter.INACTIVE,
            deleted: DeletedFilter.ALL,
            pageSize: 6,
          },

          {
            description: 'active or inactive and deleted',
            active: ActiveFilter.ALL,
            deleted: DeletedFilter.DELETED,
            pageSize: 6,
          },
          {
            description: 'active or inactive and not deleted',
            active: ActiveFilter.ALL,
            deleted: DeletedFilter.NOT_DELETED,
            pageSize: 6,
          },
          {
            description: 'active or inactive and deleted or not deleted',
            active: ActiveFilter.ALL,
            deleted: DeletedFilter.ALL,
            pageSize: 12,
          },
        ])(
          'Should do text filtering when category is $description',
          ({ description, active, deleted, pageSize }) => {
            it(`should get first page when ${description}`, async () => {
              await testCombinedParameters({
                active,
                deleted,
                page: 1,
                pageSize,
              });
            });

            it(`should get second page`, async () => {
              await testCombinedParameters({
                active,
                deleted,
                page: 2,
                pageSize,
              });
            });
          },
        );
      });
    });
  });

  describe('findForId', () => {
    it('should find category for id', async () => {
      const categoryData: any =
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);

      const categoriesBefore = await categoryRepo.find({
        order: { id: 'ASC' },
        relations: { parent: true },
      });
      const serviceCategory = await categoryService.findById(3);
      const categoriesAfter = await categoryRepo.find({
        order: { id: 'ASC' },
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
      const categoryData = TestCategoryData.dataForRepository;
      await categoryRepo.insert([
        categoryData[0],
        categoryData[1],
        categoryData[2],
      ]);
      const categoriesBefore = await categoryRepo.find();

      const fn = () => categoryService.findById(null);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(await categoryRepo.find()).toStrictEqual(categoriesBefore);
      await expect(fn()).rejects.toThrow(CategoryMessage.ID_REQUIRED);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Unprocessable Entity',
          message: CategoryMessage.ID_REQUIRED,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail when category does not exists', async () => {
      const categoryData = TestCategoryData.dataForRepository;
      await categoryRepo.insert([
        categoryData[0],
        categoryData[1],
        categoryData[2],
      ]);
      const categoriesBefore = await categoryRepo.find();

      const fn = () => categoryService.findById(200);
      await expect(fn()).rejects.toThrow(NotFoundException);
      expect(await categoryRepo.find()).toStrictEqual(categoriesBefore);
      await expect(fn()).rejects.toThrow(CategoryMessage.NOT_FOUND);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Not Found',
          message: CategoryMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
    });
  });

  describe('delete', () => {
    it('should delete category', async () => {
      const categoryData = TestCategoryData.dataForRepository;
      await categoryRepo.insert([
        categoryData[0],
        categoryData[1],
        categoryData[2],
      ]);

      const categoriesBefore = await categoryRepo.find();
      const serviceCategory = await categoryService.delete(2);
      const categoriesAfter = await categoryRepo.find();

      expect(categoriesAfter).toStrictEqual([
        categoriesBefore[0],
        categoriesBefore[2],
      ]);
      const allCategoriesAfter = await categoryRepo.find({ withDeleted: true });
      expect(allCategoriesAfter.map((category) => category.id)).toEqual([
        1, 2, 3,
      ]);
    });

    it('should fail when categoryId is not defined', async () => {
      const categoryData = TestCategoryData.dataForRepository;
      await categoryRepo.insert([
        categoryData[0],
        categoryData[1],
        categoryData[2],
      ]);
      const categoriesBefore = await categoryRepo.find();

      const fn = () => categoryService.delete(null);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(await categoryRepo.find()).toStrictEqual(categoriesBefore);
      await expect(fn()).rejects.toThrow(CategoryMessage.ID_REQUIRED);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Unprocessable Entity',
          message: CategoryMessage.ID_REQUIRED,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail when category does not exists', async () => {
      const categoryData = TestCategoryData.dataForRepository;
      await categoryRepo.insert([
        categoryData[0],
        categoryData[1],
        categoryData[2],
      ]);
      const categoriesBefore = await categoryRepo.find();

      const fn = () => categoryService.delete(200);
      await expect(fn()).rejects.toThrow(NotFoundException);
      expect(await categoryRepo.find()).toStrictEqual(categoriesBefore);
      await expect(fn()).rejects.toThrow(CategoryMessage.NOT_FOUND);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Not Found',
          message: CategoryMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
    });
  });
});
