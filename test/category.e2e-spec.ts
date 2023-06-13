import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { FindManyOptions, In, IsNull, Not, Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';
import { Role } from '../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { CreateCategoryRequestDTO } from '../src/modules/stock/controllers/category/dtos/request/create-category/create-category.request.dto';
import { CategoryMessage } from '../src/modules/stock/enums/messages/category-messages/category-messages.enum';
import { CategoryOrder } from '../src/modules/stock/enums/sort/category-order/category-order.enum';
import { CategoryEntity } from '../src/modules/stock/models/category/category.entity';
import { CategoryRepository } from '../src/modules/stock/repositories/category.repository';
import { PaginationConfig } from '../src/modules/system/dtos/request/pagination/configs/pagination.config';
import { ActiveFilter } from '../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { SortMessage } from '../src/modules/system/enums/messages/sort-messages/sort-messages.enum';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { TestCategoryData } from '../src/test/category/test-category-data';
import {
  testValidateCategoriesArrays,
  testValidateCategory,
} from '../src/test/category/test-category-utils';
import { TestDtoIdListFilter } from '../src/test/filtering/id-list-filter/test-dto-id-list-filter';
import { TestSortScenarioBuilder } from '../src/test/filtering/sort/test-service-sort-filter';
import { TestProductData } from '../src/test/product/test-product-data';
import { TestPurpose } from '../src/test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../src/test/test-data/test-active-data';
import {
  getFKAcceptableValues,
  getFKErrorDataList,
} from '../src/test/test-data/test-fk-data';
import {
  getNameAcceptableValues,
  getNameErrorDataList,
} from '../src/test/test-data/test-name-data';
import { TestDatabaseUtils } from '../src/test/test-database-utils';
import { TestUserData } from '../src/test/user/test-user-data';
import { objectToJSON } from './common/instance-to-json';
import { AbstractTestAPIActiveFilter } from './common/test-api-active';
import { AbstractTestAPIDeletedFilter } from './common/test-api-deleted';
import { AbstractTestApiPagination } from './common/test-api-pagination';
import { AbstractTestAPITextFilter } from './common/test-api-text';
import {
  TestRequestFunction,
  getHTTPDeleteMethod,
  getHTTPGetMethod,
  getHTTPPatchMethod,
  getHTTPPostMethod,
} from './common/test-request-utils';

describe('CategoryController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let categoryRepo: CategoryRepository;
  let userRepo: Repository<UserEntity>;

  let authenticationService: AuthenticationService;

  let httpGet: TestRequestFunction;
  let httpPost: TestRequestFunction;
  let httpPatch: TestRequestFunction;
  let httpDelete: TestRequestFunction;

  let rootToken: string;
  let adminToken: string;
  let userToken: string;

  let testDatabaseUtils: TestDatabaseUtils;

  async function setAuthentication() {
    const registerData = TestUserData.registerData;
    const creationData = TestUserData.creationData;
    rootToken = (await authenticationService.register(registerData[0])).data
      .payload.token;
    adminToken = (await authenticationService.register(registerData[1])).data
      .payload.token;
    userToken = (await authenticationService.register(registerData[2])).data
      .payload.token;
    await userRepo.update(2, { roles: [Role.ADMIN] });
  }

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    httpGet = getHTTPGetMethod(app);
    httpPost = getHTTPPostMethod(app);
    httpPatch = getHTTPPatchMethod(app);
    httpDelete = getHTTPDeleteMethod(app);
    // app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    categoryRepo = app.get<CategoryRepository>(CategoryRepository);
    authenticationService = app.get<AuthenticationService>(
      AuthenticationService,
    );

    userRepo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    await app.init();
    await setAuthentication();

    testDatabaseUtils = new TestDatabaseUtils(app);
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  describe('/categories (POST)', () => {
    it('should create category', async () => {
      const categoryData = TestCategoryData.dataForRepository;
      const expectedResults = categoryData.map((data, key) => {
        return {
          id: key + 1,
          name: data.name,
          active: !!data.active,
          parent: null,
        };
      });
      expectedResults[1].parent = expectedResults[0];
      expectedResults[2].parent = expectedResults[1];
      expectedResults[3].parent = expectedResults[0];
      await testDatabaseUtils.reset();

      const created = [
        await httpPost(
          '/categories',
          categoryData[0],
          HttpStatus.CREATED,
          rootToken,
        ),
        await httpPost(
          '/categories',
          categoryData[1],
          HttpStatus.CREATED,
          rootToken,
        ),
        await httpPost(
          '/categories',
          categoryData[2],
          HttpStatus.CREATED,
          adminToken,
        ),
        await httpPost(
          '/categories',
          categoryData[3],
          HttpStatus.CREATED,
          adminToken,
        ),
      ];

      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredTables).toEqual(['categories']);

      testValidateCategoriesArrays(created, expectedResults);
      const found = await categoryRepo.find({ relations: { parent: true } });
      testValidateCategoriesArrays(found, expectedResults);
    });

    describe('authentication', () => {
      it('should not allow unauthenticated', async () => {
        const categoriesData = TestCategoryData.dataForRepository;
        await httpPost(
          '/categories',
          categoriesData[0],
          HttpStatus.UNAUTHORIZED,
        );
      });
    });

    describe('authorization', () => {
      it('should not allow basic user', async () => {
        const categoriesData = TestCategoryData.dataForRepository;
        await httpPost(
          '/categories',
          categoriesData[0],
          HttpStatus.FORBIDDEN,
          userToken,
        );
      });
    });

    describe('name', () => {
      const rejects = getNameErrorDataList({
        dtoData: TestCategoryData.dataForRepository[1],
        purpose: TestPurpose.create,
      });
      it.each(rejects)(
        `should reject create category request when name is $description`,
        async ({ description, data, statusCode, response }) => {
          const categoriesData = TestCategoryData.dataForRepository.slice(0, 3);
          await categoryRepo.insert(categoriesData);
          await testDatabaseUtils.reset();

          const body = await httpPost(
            '/categories',
            data,
            statusCode,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredDatabase).toBeFalsy();
          expect(body).toEqual(response);
        },
      );

      const accepts = getNameAcceptableValues({
        dtoData: TestCategoryData.dataForRepository[1],
        purpose: TestPurpose.create,
      });

      it.each(accepts)(
        `should accept create category request when active is $description`,
        async ({ data }) => {
          await categoryRepo.insert(TestCategoryData.dataForRepository[0]);
          const expected = plainToInstance(CreateCategoryRequestDTO, {
            id: 2,
            ...data,
          });
          await testDatabaseUtils.reset();

          const created = await httpPost(
            '/categories',
            data,
            HttpStatus.CREATED,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredTables).toStrictEqual(['categories']);
          testValidateCategory(created, expected);
          expect(changes.after.categories).toHaveLength(2);
          testValidateCategory(created, expected);
          testValidateCategory(changes.after.categories[1], expected);
        },
      );
    });

    describe('active', () => {
      const rejects = getActiveErrorDataList({
        dtoData: TestCategoryData.dataForRepository[1],
      });
      it.each(rejects)(
        `should reject create category request when name is $description`,
        async ({ data, statusCode, response }) => {
          const categoriesData = TestCategoryData.dataForRepository;

          await categoryRepo.insert(categoriesData);
          await testDatabaseUtils.reset();

          const body = await httpPost(
            '/categories',
            data,
            statusCode,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredDatabase).toBeFalsy();
          expect(body).toEqual(response);
        },
      );

      const accepts = getActiveAcceptableValues({
        dtoData: TestCategoryData.dataForRepository[1],
      });
      it.each(accepts)(
        `should accept create category request when active is $description`,
        async ({ data }) => {
          await categoryRepo.insert(TestCategoryData.dataForRepository[1]);
          const expected = plainToInstance(CreateCategoryRequestDTO, {
            id: 2,
            ...data,
          });
          await testDatabaseUtils.reset();

          const created = await httpPost(
            '/categories',
            data,
            HttpStatus.CREATED,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredTables).toStrictEqual(['categories']);
          testValidateCategory(created, expected);
          expect(changes.after.categories).toHaveLength(2);
          testValidateCategory(created, expected);
          testValidateCategory(changes.after.categories[1], expected);
        },
      );
    });

    describe('parentId', () => {
      const accepts = getFKAcceptableValues({
        property: 'parentId',
        dtoData: TestCategoryData.dataForRepository[1],
        allowUndefined: true,
        allowNull: true,
      });
      it.each(accepts)(
        'should accept create category request when $description',
        async ({ data }) => {
          const categoriesData = TestCategoryData.dataForRepository;
          await categoryRepo.insert(categoriesData[0]);
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
              parent:
                data.parentId == 1
                  ? {
                      id: 1,
                      name: categoriesData[0].name,
                      active: !!categoriesData[0].active,
                    }
                  : null,
            },
          ];
          await testDatabaseUtils.reset();

          const created = await httpPost(
            '/categories',
            data,
            HttpStatus.CREATED,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredTables).toStrictEqual(['categories']);
          testValidateCategory(created, expected[1]);

          testValidateCategoriesArrays(changes.after.categories, expected);
        },
      );

      const rejects = getFKErrorDataList({
        property: 'parentId',
        dtoData: TestProductData.dataForRepository[1],
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
        'should reject category create request when parentId is $description',
        async ({ data, statusCode, response }) => {
          const categoriesData = TestCategoryData.dataForRepository.slice(0, 1);
          await categoryRepo.insert(categoriesData);
          await testDatabaseUtils.reset();

          const body = await httpPost(
            '/categories',
            data,
            statusCode,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredDatabase).toBeFalsy();
          expect(body).toEqual(response);
        },
      );

      it('should reject category create request when parentId is not found', async () => {
        const categoriesData = TestCategoryData.dataForRepository.slice(0, 1);
        await categoryRepo.insert(categoriesData);
        await testDatabaseUtils.reset();
        const data = {
          name: 'New Category',
          parentId: 200,
        };

        const body = await httpPost(
          '/categories',
          data,
          HttpStatus.NOT_FOUND,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual({
          error: 'Not Found',
          message: CategoryMessage.PARENT_CATEGORY_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      });
    });
  });

  describe('/categories (PATCH)', () => {
    it('should update category', async () => {
      const categoryData = TestCategoryData.dataForRepository;
      const expectedResults = await categoryRepo.bulkCreate(categoryData);

      expectedResults[1].name = 'New Name';
      expectedResults[1].active = true;
      expectedResults[1].parent = expectedResults[3];

      const updateData = { name: 'New Name', active: true, parentId: 4 };

      await testDatabaseUtils.reset();

      const updatedCategory = await httpPatch(
        '/categories/2',
        updateData,
        HttpStatus.OK,
        rootToken,
      );

      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredTables).toEqual(['categories']);
      testValidateCategory(updatedCategory, expectedResults[1]);
      testValidateCategoriesArrays(changes.after.categories, expectedResults);
    });

    describe('authentication', () => {
      it('should not allow unauthenticated', async () => {
        const categoriesData = TestCategoryData.dataForRepository;
        await categoryRepo.insert(categoriesData.slice(0, 2));
        await httpPatch(
          '/categories/1',
          categoriesData[2],
          HttpStatus.UNAUTHORIZED,
        );
      });
    });

    describe('authorization', () => {
      it('should not allow basic user', async () => {
        const categoriesData = TestCategoryData.dataForRepository;
        await categoryRepo.insert(categoriesData.slice(0, 2));
        await httpPatch(
          '/categories/1',
          categoriesData[2],
          HttpStatus.FORBIDDEN,
          userToken,
        );
      });
    });

    describe('name', () => {
      const rejects = getNameErrorDataList({
        dtoData: {},
        purpose: TestPurpose.update,
      });
      it.each(rejects)(
        `should reject update category request when name is $description`,
        async ({ data, response }) => {
          await categoryRepo.insert(
            TestCategoryData.dataForRepository.slice(0, 2),
          );
          await testDatabaseUtils.reset();

          const body = await httpPatch(
            '/categories/2',
            data,
            HttpStatus.UNPROCESSABLE_ENTITY,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredDatabase).toBeFalsy();
          expect(body).toEqual(response);
        },
      );

      const accepts = getNameAcceptableValues({
        dtoData: {},
        purpose: TestPurpose.update,
      });
      it.each(accepts)(
        `should accept update request when name is $description`,
        async ({ data }) => {
          await categoryRepo.bulkCreate(
            TestCategoryData.dataForRepository.slice(0, 3),
          );
          await testDatabaseUtils.reset();
          const expected = await categoryRepo.find({
            relations: { parent: true },
          });
          if (data.name !== undefined) {
            expected[1].name = data.name;
            expected[2].parent.name = data.name;
          }

          const updatedCategory = await httpPatch(
            '/categories/2',
            data,
            HttpStatus.OK,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredTables).toStrictEqual(
            data.name === undefined ? [] : ['categories'],
          );

          testValidateCategory(updatedCategory, expected[1]);
          testValidateCategoriesArrays(changes.after.categories, expected);
        },
      );
    });

    describe('active', () => {
      const rejects = getActiveErrorDataList({
        dtoData: { name: 'New Name' },
      });

      it.each(rejects)(
        `should reject update request when active is $description`,
        async ({ data, response }) => {
          const categoryData = TestCategoryData.dataForRepository.slice(0, 3);
          await categoryRepo.insert(categoryData);
          await testDatabaseUtils.reset();

          const body = await httpPatch(
            '/categories/2',
            data,
            HttpStatus.UNPROCESSABLE_ENTITY,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredDatabase).toBeFalsy();
          expect(body).toEqual(response);
        },
      );

      const accepts = getActiveAcceptableValues({
        dtoData: { name: 'New Name' },
      });

      async function prepareUpdateAcceptScenario() {
        const categoryData = TestCategoryData.dataForRepository;
        await categoryRepo.bulkCreate(categoryData);
        await testDatabaseUtils.reset();
        const expected = await categoryRepo.find({
          relations: { parent: true },
        });
        return { categoryData, expected };
      }

      async function compareUpdateResults(
        testDatabaseUtils: TestDatabaseUtils,
        updated: any,
        expected: CategoryEntity[],
        expectedItem: CategoryEntity,
      ) {
        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredTables).toStrictEqual(['categories']);
        testValidateCategory(updated, expectedItem);
        testValidateCategoriesArrays(changes.after.categories, expected);
      }

      it.each([
        { description: 'boolean true', value: true },
        { description: 'string boolean true', value: 'true' },
      ])(
        'should accept update request when active is $description',
        async ({ value }) => {
          const { categoryData, expected } =
            await prepareUpdateAcceptScenario();

          const data = { name: 'New Name', active: value };
          expected[3].name = 'New Name';
          expected[3].active = true;

          const updated = await httpPatch(
            '/categories/4',
            data,
            HttpStatus.OK,
            rootToken,
          );

          await compareUpdateResults(
            testDatabaseUtils,
            updated,
            expected,
            expected[3],
          );
        },
      );

      it.each([
        { description: 'boolean false', value: false },
        { description: 'string boolean false', value: 'false' },
      ])(
        'should accept update request when active is $description',
        async ({ value }) => {
          const { categoryData, expected } =
            await prepareUpdateAcceptScenario();

          const data = { name: 'New Name', active: value };
          expected[1].name = 'New Name';
          expected[1].active = false;
          expected[2].parent.name = 'New Name';
          expected[2].parent.active = false;

          const updated = await httpPatch(
            '/categories/2',
            data,
            HttpStatus.OK,
            rootToken,
          );

          await compareUpdateResults(
            testDatabaseUtils,
            updated,
            expected,
            expected[1],
          );
        },
      );

      it('should accept update request when active is undefined', async () => {
        const { categoryData, expected } = await prepareUpdateAcceptScenario();

        const data = { name: 'New Name', active: undefined };
        expected[1].name = 'New Name';
        expected[2].parent.name = 'New Name';

        const updated = await httpPatch(
          '/categories/2',
          data,
          HttpStatus.OK,
          rootToken,
        );

        await compareUpdateResults(
          testDatabaseUtils,
          updated,
          expected,
          expected[1],
        );
      });
    });

    describe('parentId', () => {
      it(`should accept update category request when parentId is minimum allowed`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);

        const expected = await TestCategoryData.getExpectedResults();
        expected[1].name = 'New Name';
        expected[1].active = false;
        expected[1].parent = expected[0];

        const data = { name: 'New Name', active: false, parentId: 1 };

        const updated = await httpPatch(
          `/categories/2`,
          data,
          HttpStatus.OK,
          rootToken,
        );

        testValidateCategory(updated, expected[1]);

        const categories = await categoryRepo.find({
          relations: { parent: true },
          order: { id: 'ASC' },
        });

        testValidateCategoriesArrays(categories, expected);
      });

      it(`should accept update category request when parentId is null`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);

        const expected = await TestCategoryData.getExpectedResults();
        expected[1].name = 'New Name';
        expected[1].active = false;
        expected[1].parent = null;

        const data = { name: 'New Name', active: false, parentId: null };

        const updated = await httpPatch(
          `/categories/2`,
          data,
          HttpStatus.OK,
          rootToken,
        );

        testValidateCategory(updated, expected[1]);

        const categories = await categoryRepo.find({
          relations: { parent: true },
          order: { id: 'ASC' },
        });

        testValidateCategoriesArrays(categories, expected);
      });

      it(`should accept update category request when parentId is undefined`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);

        const expected = await TestCategoryData.getExpectedResults();
        expected[1].name = 'New Name';
        expected[1].active = false;

        const data = {
          name: 'New Name',
          active: false,
          parentId: undefined,
        };

        const updated = await httpPatch(
          `/categories/2`,
          data,
          HttpStatus.OK,
          rootToken,
        );

        testValidateCategory(updated, expected[1]);

        const categories = await categoryRepo.find({
          relations: { parent: true },
          order: { id: 'ASC' },
        });

        testValidateCategoriesArrays(categories, expected);
      });

      const rejects = getFKErrorDataList({
        property: 'parentId',
        allowUndefined: true,
        allowNull: true,
        dtoData: { name: 'New Name' },
        messages: {
          invalid: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
          type: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
          undefined: CategoryMessage.REQUIRED_PARENT_CATEGORY_ID,
          null: CategoryMessage.NULL_PARENT_CATEGORY_ID,
        },
      });

      it.each(rejects)(
        'should reject update category request when parentId is $description',
        async ({ data, response }) => {
          const categoryData = TestCategoryData.dataForRepository.slice(0, 3);
          await categoryRepo.insert(categoryData);
          await testDatabaseUtils.reset();

          const body = await httpPatch(
            '/categories/2',
            data,
            HttpStatus.UNPROCESSABLE_ENTITY,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredDatabase).toBeFalsy();
          expect(body).toEqual(response);
        },
      );

      it('should reject update category request when parent category is not found', async () => {
        const categoryData = TestCategoryData.dataForRepository.slice(0, 2);
        await categoryRepo.insert(categoryData);
        await testDatabaseUtils.reset();

        const body = await httpPatch(
          '/categories/2',
          { parentId: 200 },
          HttpStatus.NOT_FOUND,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual({
          error: 'Not Found',
          message: CategoryMessage.PARENT_CATEGORY_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      });

      it(`should reject update category request when parent category is the same category being updated`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);
        const data = { name: 'New Name', active: false, parentId: 2 };
        await testDatabaseUtils.reset();

        const body = await httpPatch(
          `/categories/2`,
          data,
          HttpStatus.UNPROCESSABLE_ENTITY,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual({
          error: 'Unprocessable Entity',
          message: CategoryMessage.CANNOT_PARENT_ITSELF,
          statusCode: 422,
        });
      });

      it(`should reject update category request when parent category is descendent of the category being updated`, async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);
        const data = { name: 'New Name', active: false, parentId: 4 };
        await testDatabaseUtils.reset();

        const body = await httpPatch(
          `/categories/1`,
          data,
          HttpStatus.UNPROCESSABLE_ENTITY,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual({
          error: 'Unprocessable Entity',
          message: CategoryMessage.CANNOT_DESCEND_FROM_ITSELF,
          statusCode: 422,
        });
      });
    });
  });

  describe('/categories (GET)', () => {
    describe('authentication', () => {
      it('should allow unauthenticated', async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);
        await httpGet('/categories', {}, HttpStatus.OK);
      });
    });

    describe('authorization', () => {
      it('should allow basic user', async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);
        await httpGet('/categories', {}, HttpStatus.OK, userToken);
      });

      it('should allow admin', async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);
        await httpGet('/categories', {}, HttpStatus.OK, adminToken);
      });

      it('should allow root', async () => {
        await TestCategoryData.createCategoriesViaRepository(categoryRepo);
        await httpGet('/categories', {}, HttpStatus.OK, rootToken);
      });
    });

    it('should find categories', async () => {
      const categoryData: any = TestCategoryData.buildData(4);
      categoryData[0].active = false;
      categoryData[2].deletedAt = new Date();
      await categoryRepo.bulkCreate(categoryData);
      const categories = (
        await categoryRepo.find({
          where: {
            active: true,
          },
          relations: { parent: true },
        })
      ).map((category) => {
        const plain = instanceToPlain(category);
        return plain;
      });

      const ret = await httpGet('/categories', {}, HttpStatus.OK, rootToken);

      expect(ret).toEqual({
        count: 3,
        page: 1,
        pageSize: 12,
        results: objectToJSON(categories),
      });
    });

    it('should return empty category list', async () => {
      const ret = await httpGet('/categories', {}, HttpStatus.OK, rootToken);

      expect(ret).toEqual({
        count: 0,
        page: 1,
        pageSize: 12,
        results: [],
      });
    });

    describe('query params', () => {
      describe('text query', () => {
        class TestTextFilter extends AbstractTestAPITextFilter<CategoryEntity> {
          async insertRegisters(textToAppend: string[]) {
            const categoriesData = TestCategoryData.buildData(
              textToAppend.length,
            );
            for (let i = 0; i < textToAppend.length; i++) {
              categoriesData[i].name = textToAppend[i];
            }
            await categoryRepo.insert(categoriesData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            findManyOptions.relations = { parent: true };
            return categoryRepo.findAndCount(findManyOptions);
          }

          getPagesFromAPI(
            queryParameters: { query?: any },
            httpStatus: number,
          ) {
            return httpGet(
              '/categories',
              queryParameters,
              httpStatus,
              rootToken,
            );
          }
        }

        new TestTextFilter().executeTests();
      });

      describe('active', () => {
        class TestTextFilter extends AbstractTestAPIActiveFilter<CategoryEntity> {
          async insertRegisters(actives: boolean[]) {
            const categoriesData: any = TestCategoryData.buildData(
              actives.length,
            );
            for (let i = 0; i < actives.length; i++) {
              categoriesData[i].active = !!actives[i];
            }
            await categoryRepo.insert(categoriesData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            findManyOptions.relations = { parent: true };
            return categoryRepo.findAndCount(findManyOptions);
          }

          getPagesFromAPI(
            queryParameters: { active?: any },
            httpStatus: number,
          ) {
            return httpGet(
              '/categories',
              queryParameters,
              httpStatus,
              rootToken,
            );
          }
        }

        new TestTextFilter().executeTests();
      });

      describe('deleted', () => {
        class TestDeletedFilter extends AbstractTestAPIDeletedFilter<CategoryEntity> {
          async insertRegisters(deleteds: boolean[]) {
            const categoriesData: any[] = TestCategoryData.buildData(
              deleteds.length,
            );
            for (let i = 0; i < categoriesData.length; i++) {
              if (deleteds[i]) {
                categoriesData[i].deletedAt = new Date();
              }
            }
            await categoryRepo.insert(categoriesData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            findManyOptions.relations = { parent: true };
            return categoryRepo.findAndCount(findManyOptions);
          }

          getPagesFromAPI(
            queryParameters: { deleted?: any },
            httpStatus: number,
          ) {
            return httpGet(
              '/categories',
              queryParameters,
              httpStatus,
              rootToken,
            );
          }
        }

        new TestDeletedFilter().executeTests();
      });

      describe('parentIds', () => {
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
          const expectedResults = objectToJSON(
            await categoryRepo.find({
              where: { id: In([2, 3, 4, 5]) },
              relations: { parent: true },
            }),
          );

          const serviceCategories = await httpGet(
            '/categories',
            { active: ActiveFilter.ALL, parentIds: JSON.stringify([1, 2]) },
            HttpStatus.OK,
            rootToken,
          );

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
          const expectedResults = objectToJSON(
            (
              await categoryRepo.find({
                relations: { parent: true },
              })
            ).filter((c) => !c.parent),
          );
          try {
            const serviceCategories = await httpGet(
              '/categories',
              { active: ActiveFilter.ALL, parentIds: JSON.stringify([null]) },
              HttpStatus.OK,
              rootToken,
            );

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
          onlyQueryParameters: true,
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

        it.each(accepts)(
          'should filter categories when parentIds=$test.description',
          async ({ test }) => {
            await createTestScenario();

            const categories = (
              await categoryRepo.find({
                relations: { parent: true },
                order: { name: 'ASC' },
              })
            )
              .filter((category) => {
                if (test.normalizedData?.length) {
                  if (category.parent) {
                    return test.normalizedData.includes(category.parent.id);
                  } else {
                    return test.normalizedData.includes(null);
                  }
                }
                return true;
              })
              .map((category) => objectToJSON(category));

            const results = await httpGet(
              '/categories',
              {
                active: ActiveFilter.ALL,
                parentIds: test.data,
                orderBy: JSON.stringify([CategoryOrder.NAME_ASC]),
              },
              HttpStatus.OK,
              rootToken,
            );

            expect(results).toEqual({
              count: categories.length,
              page: 1,
              pageSize: 12,
              results: categories,
            });
          },
        );

        it.each(rejects)('$description', async ({ test, message }) => {
          await createTestScenario();
          const apiResult = await httpGet(
            '/categories',
            { active: ActiveFilter.ALL, parentIds: test.data },
            HttpStatus.UNPROCESSABLE_ENTITY,
            rootToken,
          );

          expect(apiResult).toEqual({
            error: 'UnprocessableEntityException',
            message: { parentIds: message },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        });
      });

      describe('pagination', () => {
        class TestPagination extends AbstractTestApiPagination<CategoryEntity> {
          insertRegisters(quantity: number): Promise<any> {
            return categoryRepo.insert(TestCategoryData.buildData(quantity));
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            findManyOptions.relations = { parent: true };
            return categoryRepo.findAndCount(findManyOptions);
          }

          getPagesFromAPI(
            queryParameters: { page?: any; pageSize?: any },
            httpStatus: number,
          ) {
            return httpGet(
              '/categories',
              queryParameters,
              httpStatus,
              rootToken,
            );
          }
        }

        new TestPagination().executeTests();
      });

      describe('sort', () => {
        const testSortScenario = new TestSortScenarioBuilder<
          typeof CategoryOrder
        >(CategoryOrder, [CategoryOrder.NAME_ASC], 'api');

        const categoryData = [];
        for (let name of ['Category 1', 'Category 2']) {
          for (let active of [true, false]) {
            for (let i = 1; i <= 2; i++) {
              categoryData.push({ name: name, active });
            }
          }
        }

        it.each(testSortScenario.generateSuccessTestScenarios())(
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
            const apiResult = await httpGet(
              '/categories',
              { orderBy: JSON.stringify(orderBy), active: ActiveFilter.ALL },
              HttpStatus.OK,
              rootToken,
            );

            // test
            expect(apiResult).toEqual({
              count: 8,
              page: 1,
              pageSize: 12,
              results: objectToJSON(repositoryResults),
            });
          },
        );

        it('should fail when receives invalid orderBy item string', async () => {
          // prepare
          await categoryRepo.insert(categoryData);

          // execute
          const apiResult = await httpGet(
            '/categories',
            {
              orderBy: ['invalid_impossible_and_never_gonna_happen'],
              active: ActiveFilter.ALL,
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
            rootToken,
          );

          expect(apiResult).toEqual({
            error: 'UnprocessableEntityException',
            message: {
              orderBy: SortMessage.INVALID,
            },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        });
      });
    });

    describe('combined parameters', () => {
      it('should return results filtered by all parameters', async () => {
        const categoriesData: any = TestCategoryData.buildData(20);
        for (let i = 0; i < categoriesData.length; i++) {
          categoriesData[i].active = i == 2;
          if (i != 4) {
            categoriesData[i].deletedAt = new Date();
          }
        }

        await categoryRepo.insert(categoriesData);
        const pages = [
          await categoryRepo.find({
            skip: 0,
            take: 8,
            where: {
              active: false,
              deletedAt: Not(IsNull()),
            },
            relations: { parent: true },
            order: { name: 'ASC' },
            withDeleted: true,
          }),
          await categoryRepo.find({
            skip: 8,
            take: 8,
            where: {
              active: false,
              deletedAt: Not(IsNull()),
            },
            relations: { parent: true },
            order: { name: 'ASC' },
            withDeleted: true,
          }),
          await categoryRepo.find({
            skip: 16,
            take: 8,
            where: {
              active: false,
              deletedAt: Not(IsNull()),
            },
            relations: { parent: true },
            order: { name: 'ASC' },
            withDeleted: true,
          }),
        ];

        const ret = [
          await httpGet(
            '/categories',
            {
              page: 1,
              pageSize: 8,
              deleted: DeletedFilter.DELETED,
              active: ActiveFilter.INACTIVE,
            },
            HttpStatus.OK,
            rootToken,
          ),
          await httpGet(
            '/categories',
            {
              page: 2,
              pageSize: 8,
              deleted: DeletedFilter.DELETED,
              active: ActiveFilter.INACTIVE,
            },
            HttpStatus.OK,
            rootToken,
          ),
          await httpGet(
            '/categories',
            {
              page: 3,
              pageSize: 8,
              deleted: DeletedFilter.DELETED,
              active: ActiveFilter.INACTIVE,
            },
            HttpStatus.OK,
            rootToken,
          ),
          await httpGet(
            '/categories',
            {
              page: 4,
              pageSize: 8,
              deleted: DeletedFilter.DELETED,
              active: ActiveFilter.INACTIVE,
            },
            HttpStatus.OK,
            rootToken,
          ),
        ];

        expect(ret).toEqual([
          {
            count: 18,
            page: 1,
            pageSize: 8,
            results: objectToJSON(pages[0]),
          },
          {
            count: 18,
            page: 2,
            pageSize: 8,
            results: objectToJSON(pages[1]),
          },
          {
            count: 18,
            page: 3,
            pageSize: 8,
            results: objectToJSON(pages[2]),
          },
          {
            count: 18,
            page: 4,
            pageSize: 8,
            results: [],
          },
        ]);
      });
    });
  });

  describe('/categories/categoryId (GET)', () => {
    it('should find category for id', async () => {
      const categoryData = TestCategoryData.dataForRepository.slice(0, 3);
      await categoryRepo.insert(categoryData);
      await httpGet('/categories/2', {}, HttpStatus.OK, rootToken);
    });

    it('should fail to find category when category does not exists', async () => {
      const categoryData = TestCategoryData.dataForRepository.slice(0, 3);
      await categoryRepo.insert(categoryData[0]);
      await testDatabaseUtils.reset();

      const body = await httpGet(
        '/categories/200',
        {},
        HttpStatus.NOT_FOUND,
        rootToken,
      );
      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredDatabase).toBeFalsy();
      expect(body).toEqual({
        error: 'Not Found',
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    describe('authentication', () => {
      it('should allow unauthenticated', async () => {
        const categoriesData = TestCategoryData.dataForRepository.slice(0, 1);
        await categoryRepo.insert(categoriesData);
        await httpGet('/categories/1', {}, HttpStatus.OK);
      });
    });

    describe('authorization', () => {
      it('should allow basic user', async () => {
        const categoriesData = TestCategoryData.dataForRepository.slice(0, 1);
        await categoryRepo.insert(categoriesData);
        await httpGet('/categories/1', {}, HttpStatus.OK, userToken);
      });
    });
  });

  describe('/categories/categoryId (DELETE)', () => {
    it('should soft-delete category', async () => {
      const categoryData = TestCategoryData.dataForRepository.slice(0, 3);
      await categoryRepo.insert(categoryData);
      await testDatabaseUtils.reset();

      const deletedCategory = await httpDelete(
        '/categories/2',
        {},
        HttpStatus.OK,
        rootToken,
      );

      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredTables).toEqual(['categories']);

      // expect(categoriesAfter).toStrictEqual([categoriesBefore[0], categoriesBefore[2]]);
      const allCategoriesAfter = await categoryRepo.find({ withDeleted: true });
      expect(allCategoriesAfter.map((category) => category.id)).toEqual([
        1, 2, 3,
      ]);
    });

    it.skip('should desativate the category and its and subcategories on soft-delete and delete subcategories', async () => {});

    it.skip('should desativate the category and its and subcateories on soft-delete', async () => {});

    it('should fail to soft-delete when category does not exists', async () => {
      const categoryData = TestCategoryData.dataForRepository.slice(0, 3);
      await categoryRepo.insert(categoryData);
      await testDatabaseUtils.reset();

      const body = await httpDelete(
        '/categories/200',
        { query: {} },
        HttpStatus.NOT_FOUND,
        rootToken,
      );
      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredDatabase).toBeFalsy();
      expect(body).toEqual({
        error: 'Not Found',
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    describe('authentication', () => {
      it('should not allow unauthenticated', async () => {
        const categoriesData = TestCategoryData.dataForRepository.slice(0, 3);
        await categoryRepo.insert(categoriesData);
        await httpDelete('/categories/1', {}, HttpStatus.UNAUTHORIZED);
      });
    });

    describe('authorization', () => {
      it('should not allow basic user', async () => {
        const categoriesData = TestCategoryData.dataForRepository.slice(0, 3);
        await categoryRepo.insert(categoriesData);
        await httpDelete('/categories/1', {}, HttpStatus.FORBIDDEN, userToken);
      });
    });
  });
});
