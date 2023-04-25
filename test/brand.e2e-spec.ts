import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';

import { plainToInstance } from 'class-transformer';
import { Role } from '../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { CreateBrandRequestDTO } from '../src/modules/stock/dtos/request/create-brand/create-brand.request.dto';
import { UpdateBrandRequestDTO } from '../src/modules/stock/dtos/request/update-brand/update-brand.request.dto';
import { BrandMessage } from '../src/modules/stock/enums/brand-messages/brand-messages.enum';
import { BrandEntity } from '../src/modules/stock/models/brand/brand.entity';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { TestBrandData } from '../src/test/test-brand-data';
import { testValidateBrand } from '../src/test/test-brand-utils';
import { TestDatabaseUtils } from '../src/test/test-database-utils';
import { TestProductData } from '../src/test/test-product-data';
import { TestUserData } from '../src/test/test-user-data';
import {
  TestRequestFunction,
  getHTTPDeleteMethod,
  getHTTPGetMethod,
  getHTTPPatchMethod,
  getHTTPPostMethod,
} from './test-request-utils';

describe('StockController (e2e)', () => {
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

  describe('/brand', () => {
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
          await httpPost(
            '/brands',
            brandData[0],
            HttpStatus.CREATED,
            rootToken,
          ),
          await httpPost(
            '/brands',
            brandData[1],
            HttpStatus.CREATED,
            rootToken,
          ),
          await httpPost(
            '/brands',
            brandData[2],
            HttpStatus.CREATED,
            adminToken,
          ),
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
        ...TestBrandData.getNameErrorDataList('create'),
        ...TestBrandData.getActiveErrorDataList(),
      ])(
        '$property',
        ({ property, data, response, statusCode, description }) => {
          it(`should fail when ${property} is ${description}`, async () => {
            const brandData = TestBrandData.dataForRepository;
            await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
            await testDatabaseUtils.reset();

            const body = await httpPost('/brands', data, statusCode, rootToken);

            const changes = await testDatabaseUtils.checkChanges();
            expect(changes.alteredDatabase).toBeFalsy();
            expect(body).toEqual(response);
          });
        },
      );

      describe.each([
        ...TestBrandData.getNameAcceptableValues('create'),
        ...TestBrandData.getActiveAcceptableValues(),
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
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);

        const updateData = { name: 'New Name', active: true };
        const expectedResults = [
          { id: 1, name: brandData[0].name, active: !!brandData[0].active },
          { id: 2, name: updateData.name, active: !!updateData.active },
          { id: 3, name: brandData[2].name, active: !!brandData[2].active },
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
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1]]);
          await httpPatch('/brands/1', brandData[2], HttpStatus.UNAUTHORIZED);
        });
      });

      describe('authorization', () => {
        it('should not allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1]]);
          await httpPatch(
            '/brands/1',
            brandData[2],
            HttpStatus.FORBIDDEN,
            userToken,
          );
        });
      });

      describe.each([
        ...TestBrandData.getNameErrorDataList('update'),
        ...TestBrandData.getActiveErrorDataList(),
      ])('$property', ({ property, description, data, response }) => {
        it(`should fail when ${property} is ${description}`, async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
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
        ...TestBrandData.getNameAcceptableValues('update'),
        ...TestBrandData.getActiveAcceptableValues(),
      ])('$property', ({ property, data }) => {
        it('should validate when $property is $description', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          await testDatabaseUtils.reset();

          const expectedBrandResults = [
            plainToInstance(UpdateBrandRequestDTO, { id: 1, ...brandData[0] }),
            plainToInstance(UpdateBrandRequestDTO, { id: 2, ...data }),
            plainToInstance(UpdateBrandRequestDTO, { id: 3, ...brandData[2] }),
          ];
          if (data[property] == null) {
            expectedBrandResults[1][property] = brandData[1][property];
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
      it('should find brands', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        await testDatabaseUtils.reset();

        const foundBrands = await httpGet(
          '/brands',
          {},
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        testValidateBrand(foundBrands[0], changes.after.brands[0]);
        testValidateBrand(foundBrands[1], changes.after.brands[1]);
        testValidateBrand(foundBrands[2], changes.after.brands[2]);
      });

      it('should return empty list', async () => {
        await testDatabaseUtils.reset();

        const foundBrands = await httpGet(
          '/brands',
          {},
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(foundBrands).toStrictEqual([]);
      });

      describe('authentication', () => {
        it('should allow unauthenticated', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0]]);
          await httpGet('/brands', {}, HttpStatus.OK);
        });
      });

      describe('authorization', () => {
        it('should allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0]]);
          await httpGet('/brands', {}, HttpStatus.OK, userToken);
        });
      });
    });

    describe('/brands/brandId (GET)', () => {
      it('should find brand for id', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        await httpGet('/brands/2', {}, HttpStatus.OK, rootToken);
      });

      it('should fail when brand does not exists', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
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
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0]]);
          await httpGet('/brands/1', {}, HttpStatus.OK);
        });
      });

      describe('authorization', () => {
        it('should allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0]]);
          await httpGet('/brands/1', {}, HttpStatus.OK, userToken);
        });
      });
    });

    describe('/brands/brandId (DELETE)', () => {
      it('should update brand', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
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
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
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
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await brandRepo.insert([
            productData[0],
            productData[1],
            productData[2],
          ]);

          await httpDelete('/brands/1', {}, HttpStatus.UNAUTHORIZED);
        });
      });

      describe('authorization', () => {
        it('should not allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await brandRepo.insert([
            productData[0],
            productData[1],
            productData[2],
          ]);

          await httpDelete('/brands/1', {}, HttpStatus.FORBIDDEN, userToken);
        });
      });
    });

    describe('stock/brands/search (GET)', () => {
      it('should textual search brands', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        await testDatabaseUtils.reset();

        const results1 = await httpGet(
          '/brands/search',
          { query: 'rand 1' },
          HttpStatus.OK,
          rootToken,
        );

        const changes1 = await testDatabaseUtils.checkChanges();
        expect(changes1.alteredDatabase).toBeFalsy();

        const results2 = await httpGet(
          '/brands/search',
          { query: 'Brand' },
          HttpStatus.OK,
          rootToken,
        );

        const changes2 = await testDatabaseUtils.checkChanges();
        expect(changes2.alteredDatabase).toBeFalsy();

        expect(results1).toHaveLength(1);
        testValidateBrand(results1[0], changes2.after.brands[0]);

        expect(results2).toHaveLength(3);
        testValidateBrand(results2[0], changes2.after.brands[0]);
        testValidateBrand(results2[1], changes2.after.brands[1]);
        testValidateBrand(results2[2], changes2.after.brands[2]);
      });

      it('should textual search brands with empty results', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        await testDatabaseUtils.reset();

        const results = await httpGet(
          '/brands/search',
          { query: 'not found text' },
          HttpStatus.OK,
          rootToken,
        );
        const changes1 = await testDatabaseUtils.checkChanges();

        expect(changes1.alteredDatabase).toBeFalsy();
        expect(results).toHaveLength(0);
      });

      it('should fail when parameter is not string', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        await testDatabaseUtils.reset();

        const body = await httpGet(
          '/brands/search',
          { query: {} },
          HttpStatus.UNPROCESSABLE_ENTITY,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual({
          error: 'Unprocessable Entity',
          message: 'Search must be string',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      });

      it('should fail when parameter is empty string', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        await testDatabaseUtils.reset();

        const body = await httpGet(
          '/brands/search',
          { query: '' },
          HttpStatus.UNPROCESSABLE_ENTITY,
          rootToken,
        );
        const changes = await testDatabaseUtils.checkChanges();

        expect(body).toEqual({
          error: 'Unprocessable Entity',
          message: 'Search is empty',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });

        expect(changes.alteredDatabase).toBeFalsy();
      });

      describe('authentication', () => {
        it('should allow unauthenticated', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          await httpGet('/brands', { query: 'rand 1' }, HttpStatus.OK);
        });
      });

      describe('authorization', () => {
        it('should allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          await httpGet(
            '/brands',
            { query: 'rand 1' },
            HttpStatus.OK,
            userToken,
          );
        });
      });
    });
  });
});
