import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindManyOptions, IsNull, Not, Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';

import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Role } from '../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { CreateBrandRequestDTO } from '../src/modules/stock/dtos/request/create-brand/create-brand.request.dto';
import { UpdateBrandRequestDTO } from '../src/modules/stock/dtos/request/update-brand/update-brand.request.dto';
import { BrandMessage } from '../src/modules/stock/enums/messages/brand-messages/brand-messages.enum';
import { BrandOrder } from '../src/modules/stock/enums/sort/brand-order/brand-order.enum';
import { BrandEntity } from '../src/modules/stock/models/brand/brand.entity';
import { PaginationConfig } from '../src/modules/system/dtos/request/pagination/configs/pagination.config';
import { ActiveFilter } from '../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { SortMessage } from '../src/modules/system/enums/messages/sort-messages/sort-messages.enum';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { TestBrandData } from '../src/test/brand/test-brand-data';
import { testValidateBrand } from '../src/test/brand/test-brand-utils';
import { TestSortScenarioBuilder } from '../src/test/filtering/sort/test-service-sort-filter';
import { TestPurpose } from '../src/test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../src/test/test-data/test-active-data';
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

describe('BrandController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let brandRepo: Repository<BrandEntity>;
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
    brandRepo = app.get<Repository<BrandEntity>>(
      getRepositoryToken(BrandEntity),
    );
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

  describe('/brands (POST)', () => {
    it('should create brand', async () => {
      const brandData = TestBrandData.dataForRepository;
      const expectedResults = [
        { id: 1, ...brandData[0] },
        { id: 2, ...brandData[1] },
        { id: 3, ...brandData[2], active: false },
      ];
      await testDatabaseUtils.reset();

      const createdBrands = [
        await httpPost('/brands', brandData[0], HttpStatus.CREATED, rootToken),
        await httpPost('/brands', brandData[1], HttpStatus.CREATED, rootToken),
        await httpPost('/brands', brandData[2], HttpStatus.CREATED, adminToken),
      ];

      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredTables).toEqual(['brands']);

      testValidateBrand(createdBrands[0], expectedResults[0]);
      testValidateBrand(createdBrands[1], expectedResults[1]);
      testValidateBrand(createdBrands[2], expectedResults[2]);
      const brands = await brandRepo.find();
      expect(brands).toHaveLength(3);
      testValidateBrand(brands[0], expectedResults[0]);
      testValidateBrand(brands[1], expectedResults[1]);
      testValidateBrand(brands[2], expectedResults[2]);
    });

    describe('authentication', () => {
      it('should not allow unauthenticated', async () => {
        const brandData = TestBrandData.dataForRepository;
        await httpPost('/brands', brandData[0], HttpStatus.UNAUTHORIZED);
      });
    });

    describe('authorization', () => {
      it('should not allow basic user', async () => {
        const brandData = TestBrandData.dataForRepository;
        await httpPost(
          '/brands',
          brandData[0],
          HttpStatus.FORBIDDEN,
          userToken,
        );
      });
    });

    describe.each([
      ...getNameErrorDataList({
        dtoData: TestBrandData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
      ...getActiveErrorDataList({
        dtoData: TestBrandData.dataForRepository[1],
      }),
    ])('$property', ({ property, data, response, statusCode, description }) => {
      it(`should fail when ${property} is ${description}`, async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 3);
        await brandRepo.insert(brandiesData);
        await testDatabaseUtils.reset();

        const body = await httpPost('/brands', data, statusCode, rootToken);

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual(response);
      });
    });

    describe.each([
      ...getNameAcceptableValues({
        dtoData: TestBrandData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
      ...getActiveAcceptableValues({
        dtoData: TestBrandData.dataForRepository[1],
      }),
    ])('$property', ({ data, property, description }) => {
      it(`should validate when ${property} is ${description}`, async () => {
        const expectedResult = plainToInstance(CreateBrandRequestDTO, {
          id: 1,
          ...data,
        });
        await testDatabaseUtils.reset();

        const createdBrand = await httpPost(
          '/brands',
          data,
          HttpStatus.CREATED,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredTables).toStrictEqual(['brands']);
        testValidateBrand(createdBrand, expectedResult);
        expect(changes.after.brands).toHaveLength(1);
        testValidateBrand(createdBrand, expectedResult);
        testValidateBrand(changes.after.brands[0], expectedResult);
      });
    });
  });

  describe('/brands (PATCH)', () => {
    it('should update brand', async () => {
      const brandiesData = TestBrandData.dataForRepository.slice(0, 3);
      await brandRepo.insert(brandiesData);

      const updateData = { name: 'New Name', active: true };
      const expectedResults = [
        { id: 1, name: brandiesData[0].name, active: !!brandiesData[0].active },
        { id: 2, name: updateData.name, active: !!updateData.active },
        { id: 3, name: brandiesData[2].name, active: !!brandiesData[2].active },
      ];
      await testDatabaseUtils.reset();

      const updatedBrand = await httpPatch(
        '/brands/2',
        updateData,
        HttpStatus.OK,
        rootToken,
      );

      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredTables).toEqual(['brands']);
      testValidateBrand(updatedBrand, expectedResults[1]);
      expect(changes.after.brands).toHaveLength(3);
      testValidateBrand(changes.after.brands[0], expectedResults[0]);
      testValidateBrand(changes.after.brands[1], expectedResults[1]);
      testValidateBrand(changes.after.brands[2], expectedResults[2]);
    });

    describe('authentication', () => {
      it('should not allow unauthenticated', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 2);
        await brandRepo.insert(brandiesData);
        await httpPatch('/brands/1', brandiesData[2], HttpStatus.UNAUTHORIZED);
      });
    });

    describe('authorization', () => {
      it('should not allow basic user', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 3);
        await brandRepo.insert(brandiesData);
        await httpPatch(
          '/brands/1',
          brandiesData[2],
          HttpStatus.FORBIDDEN,
          userToken,
        );
      });
    });

    describe.each([
      ...getNameErrorDataList({
        dtoData: TestBrandData.dataForRepository[1],
        purpose: TestPurpose.update,
      }),
      ...getActiveErrorDataList({
        dtoData: TestBrandData.dataForRepository[1],
      }),
    ])('$property', ({ property, description, data, response }) => {
      it(`should fail when ${property} is ${description}`, async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 1);
        await brandRepo.insert(brandiesData);
        await testDatabaseUtils.reset();

        const body = await httpPatch(
          '/brands/2',
          data,
          HttpStatus.UNPROCESSABLE_ENTITY,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual(response);
      });
    });

    describe.each([
      ...getNameAcceptableValues({
        dtoData: TestBrandData.dataForRepository[1],
        purpose: TestPurpose.update,
      }),
      ...getActiveAcceptableValues({
        dtoData: TestBrandData.dataForRepository[1],
      }),
    ])('$property', ({ description, property, data }) => {
      it(`should validate when $property is ${description}`, async () => {
        const brandsData = TestBrandData.dataForRepository.slice(0, 3);
        await brandRepo.insert(brandsData);
        await testDatabaseUtils.reset();

        const expectedBrandResults = [
          plainToInstance(UpdateBrandRequestDTO, { id: 1, ...brandsData[0] }),
          plainToInstance(UpdateBrandRequestDTO, { id: 2, ...data }),
          plainToInstance(UpdateBrandRequestDTO, { id: 3, ...brandsData[2] }),
        ];
        if (data[property] == null) {
          expectedBrandResults[1][property] = brandsData[1][property];
        }

        const updatedBrand = await httpPatch(
          '/brands/2',
          data,
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        // in this cases brand[1] will not be updated
        if (property == 'active') {
          if ([undefined, 'false', false, null].includes(data.active)) {
            expect(changes.alteredTables).toStrictEqual([]);
          } else {
            expect(changes.alteredTables).toStrictEqual(['brands']);
          }
        } else if (property == 'name') {
          if ([undefined].includes(data.name)) {
            expect(changes.alteredTables).toStrictEqual([]);
          } else {
            expect(changes.alteredTables).toStrictEqual(['brands']);
          }
        } else {
          expect(changes.alteredTables).toStrictEqual(['brands']);
        }

        testValidateBrand(updatedBrand, expectedBrandResults[1]);
        expect(changes.after.brands).toHaveLength(3);
        testValidateBrand(changes.after.brands[0], expectedBrandResults[0]);
        testValidateBrand(changes.after.brands[1], expectedBrandResults[1]);
        testValidateBrand(changes.after.brands[2], expectedBrandResults[2]);
      });
    });
  });

  describe('/brands (GET)', () => {
    describe('authentication', () => {
      it('should allow unauthenticated', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 1);
        await brandRepo.insert(brandiesData);
        await httpGet('/brands', {}, HttpStatus.OK);
      });
    });

    describe('authorization', () => {
      it('should allow basic user', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 1);
        await brandRepo.insert(brandiesData);
        await httpGet('/brands', {}, HttpStatus.OK, userToken);
      });

      it('should allow admin', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 1);
        await brandRepo.insert(brandiesData);
        await httpGet('/brands', {}, HttpStatus.OK, adminToken);
      });

      it('should allow root', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 1);
        await brandRepo.insert(brandiesData);
        await httpGet('/brands', {}, HttpStatus.OK, rootToken);
      });
    });

    it('should find brands', async () => {
      const brandData: any = TestBrandData.buildData(4);
      brandData[0].active = false;
      brandData[2].deletedAt = new Date();
      await brandRepo.insert(brandData);
      const brands = (
        await brandRepo.find({
          where: {
            active: true,
          },
        })
      ).map((brand) => {
        const plain = instanceToPlain(brand);
        return plain;
      });

      const ret = await httpGet('/brands', {}, HttpStatus.OK, rootToken);

      expect(ret).toEqual({
        count: 2,
        page: 1,
        pageSize: 12,
        results: objectToJSON(brands),
      });
    });

    it('should return empty list', async () => {
      const ret = await httpGet('/brands', {}, HttpStatus.OK, rootToken);

      expect(ret).toEqual({
        count: 0,
        page: 1,
        pageSize: 12,
        results: [],
      });
    });

    describe('query params', () => {
      describe('text query', () => {
        class TestTextFilter extends AbstractTestAPITextFilter<BrandEntity> {
          async insertRegisters(textToAppend: string[]) {
            const brandsData = TestBrandData.buildData(textToAppend.length);
            for (let i = 0; i < textToAppend.length; i++) {
              brandsData[i].name = textToAppend[i];
            }
            await brandRepo.insert(brandsData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            return brandRepo.findAndCount(findManyOptions);
          }

          getPagesFromAPI(
            queryParameters: { query?: any },
            httpStatus: number,
          ) {
            return httpGet('/brands', queryParameters, httpStatus, rootToken);
          }
        }

        new TestTextFilter().executeTests();
      });

      describe('active', () => {
        class TestTextFilter extends AbstractTestAPIActiveFilter<BrandEntity> {
          async insertRegisters(actives: boolean[]) {
            const brandsData: any = TestBrandData.buildData(actives.length);
            for (let i = 0; i < actives.length; i++) {
              brandsData[i].active = !!actives[i];
            }
            await brandRepo.insert(brandsData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            return brandRepo.findAndCount(findManyOptions);
          }

          getPagesFromAPI(
            queryParameters: { active?: any },
            httpStatus: number,
          ) {
            return httpGet('/brands', queryParameters, httpStatus, rootToken);
          }
        }

        new TestTextFilter().executeTests();
      });

      describe('deleted', () => {
        class TestDeletedFilter extends AbstractTestAPIDeletedFilter<BrandEntity> {
          async insertRegisters(deleteds: boolean[]) {
            const brandsData: any[] = TestBrandData.buildData(deleteds.length);
            for (let i = 0; i < brandsData.length; i++) {
              if (deleteds[i]) {
                brandsData[i].deletedAt = new Date();
              }
            }
            await brandRepo.insert(brandsData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            return brandRepo.findAndCount(findManyOptions);
          }

          getPagesFromAPI(
            queryParameters: { deleted?: any },
            httpStatus: number,
          ) {
            return httpGet('/brands', queryParameters, httpStatus, rootToken);
          }
        }

        new TestDeletedFilter().executeTests();
      });

      describe('pagination', () => {
        class TestPagination extends AbstractTestApiPagination<BrandEntity> {
          insertRegisters(quantity: number): Promise<any> {
            return brandRepo.insert(TestBrandData.buildData(quantity));
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.order = { name: 'ASC' };
            return brandRepo.findAndCount(findManyOptions);
          }

          getPagesFromAPI(
            queryParameters: { page?: any; pageSize?: any },
            httpStatus: number,
          ) {
            return httpGet('/brands', queryParameters, httpStatus, rootToken);
          }
        }

        new TestPagination().executeTests();
      });

      describe('sort', () => {
        const testSortScenario = new TestSortScenarioBuilder<typeof BrandOrder>(
          BrandOrder,
          [BrandOrder.NAME_ASC],
          'api',
        );

        const brandData = [];
        for (let name of ['Brand 1', 'Brand 2']) {
          for (let active of [true, false]) {
            for (let i = 1; i <= 2; i++) {
              brandData.push({ name: name, active });
            }
          }
        }

        it.each(testSortScenario.generateSuccessTestScenarios())(
          `should order results when orderBy=$description`,
          async ({ orderBySQL, orderBy }) => {
            // prepare
            await brandRepo.insert(brandData);
            const repositoryResults = await brandRepo.find({
              order: orderBySQL,
              take: PaginationConfig.DEFAULT_PAGE_SIZE,
            });

            // execute
            const apiResult = await httpGet(
              '/brands',
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
          await brandRepo.insert(brandData);

          // execute
          const apiResult = await httpGet(
            '/brands',
            {
              orderBy: JSON.stringify([
                'invalid_impossible_and_never_gonna_happen',
              ]),
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
        const brandsData: any = TestBrandData.buildData(20);
        for (let i = 0; i < brandsData.length; i++) {
          brandsData[i].active = i == 2;
          if (i != 4) {
            brandsData[i].deletedAt = new Date();
          }
        }

        await brandRepo.insert(brandsData);
        const pages = [
          await brandRepo.find({
            skip: 0,
            take: 8,
            where: {
              active: false,
              deletedAt: Not(IsNull()),
            },
            order: { name: 'ASC' },
            withDeleted: true,
          }),
          await brandRepo.find({
            skip: 8,
            take: 8,
            where: {
              active: false,
              deletedAt: Not(IsNull()),
            },
            order: { name: 'ASC' },
            withDeleted: true,
          }),
          await brandRepo.find({
            skip: 16,
            take: 8,
            where: {
              active: false,
              deletedAt: Not(IsNull()),
            },
            order: { name: 'ASC' },
            withDeleted: true,
          }),
        ];

        const ret = [
          await httpGet(
            '/brands',
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
            '/brands',
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
            '/brands',
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
            '/brands',
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

  describe('/brands/brandId (GET)', () => {
    it('should find brand for id', async () => {
      const brandiesData = TestBrandData.dataForRepository.slice(0, 3);
      await brandRepo.insert(brandiesData);
      await httpGet('/brands/2', {}, HttpStatus.OK, rootToken);
    });

    it('should fail when brand does not exists', async () => {
      const brandiesData = TestBrandData.dataForRepository.slice(0, 3);
      await brandRepo.insert(brandiesData);
      await testDatabaseUtils.reset();

      const body = await httpGet(
        '/brands/200',
        {},
        HttpStatus.NOT_FOUND,
        rootToken,
      );
      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredDatabase).toBeFalsy();
      expect(body).toEqual({
        error: 'Not Found',
        message: BrandMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    describe('authentication', () => {
      it('should allow unauthenticated', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 1);
        await brandRepo.insert(brandiesData);
        await httpGet('/brands/1', {}, HttpStatus.OK);
      });
    });

    describe('authorization', () => {
      it('should allow basic user', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 1);
        await brandRepo.insert(brandiesData);
        await httpGet('/brands/1', {}, HttpStatus.OK, userToken);
      });
    });
  });

  describe('/brands/brandId (DELETE)', () => {
    it('should soft-delete brand', async () => {
      const brandiesData = TestBrandData.dataForRepository.slice(0, 3);
      await brandRepo.insert(brandiesData);
      await testDatabaseUtils.reset();

      const deletedBrand = await httpDelete(
        '/brands/2',
        {},
        HttpStatus.OK,
        rootToken,
      );

      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredTables).toEqual(['brands']);

      // expect(brandsAfter).toStrictEqual([brandsBefore[0], brandsBefore[2]]);
      const allBrandsAfter = await brandRepo.find({ withDeleted: true });
      expect(allBrandsAfter.map((brand) => brand.id)).toEqual([1, 2, 3]);
    });

    it('should fail when brand does not exists', async () => {
      const brandiesData = TestBrandData.dataForRepository;
      await brandRepo.insert(brandiesData);
      await testDatabaseUtils.reset();

      const body = await httpDelete(
        '/brands/200',
        { query: {} },
        HttpStatus.NOT_FOUND,
        rootToken,
      );
      const changes = await testDatabaseUtils.checkChanges();
      expect(changes.alteredDatabase).toBeFalsy();
      expect(body).toEqual({
        error: 'Not Found',
        message: BrandMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    describe('authentication', () => {
      it('should not allow unauthenticated', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 3);
        await brandRepo.insert(brandiesData);
        await httpDelete('/brands/1', {}, HttpStatus.UNAUTHORIZED);
      });
    });

    describe('authorization', () => {
      it('should not allow basic user', async () => {
        const brandiesData = TestBrandData.dataForRepository.slice(0, 3);
        await brandRepo.insert(brandiesData);

        await httpDelete('/brands/1', {}, HttpStatus.FORBIDDEN, userToken);
      });
    });
  });
});
