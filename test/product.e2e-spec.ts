import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';

import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Role } from '../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { CreateProductRequestDTO } from '../src/modules/stock/dtos/request/create-product/create-product.request.dto';
import { UpdateProductRequestDTO } from '../src/modules/stock/dtos/request/update-product/update-product.request.dto';
import { BrandMessage } from '../src/modules/stock/enums/brand-messages/brand-messages.enum';
import { ProductMessage } from '../src/modules/stock/enums/product-messages/product-messages.enum';
import { BrandEntity } from '../src/modules/stock/models/brand/brand.entity';
import { ProductEntity } from '../src/modules/stock/models/product/product.entity';
import { SuccessResponseDto } from '../src/modules/system/dtos/response/pagination/success.response.dto';
import { ActiveFilter } from '../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { UserService } from '../src/modules/user/services/user/user.service';
import { TestBrandData } from '../src/test/test-brand-data';
import { TestPurpose } from '../src/test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../src/test/test-data/test-active-data';
import {
  getBrandIdAcceptableValues,
  getBrandIdErrorDataList,
} from '../src/test/test-data/test-brand-id.-data';
import {
  getCodeAcceptableValues,
  getCodeErrorDataList,
} from '../src/test/test-data/test-code-data';
import {
  getModelAcceptableValues,
  getModelErrorDataList,
} from '../src/test/test-data/test-model-data';
import {
  getNameAcceptableValues,
  getNameErrorDataList,
} from '../src/test/test-data/test-name-data';
import {
  getPriceAcceptableValues,
  getPriceErrorDataList,
} from '../src/test/test-data/test-price-data';
import {
  getQuantityInStockAcceptableValues,
  getQuantityInStockErrorDataList,
} from '../src/test/test-data/test-quantity-in-stock-data';
import { TestDatabaseUtils } from '../src/test/test-database-utils';
import { TestProductData } from '../src/test/test-product-data';
import { testValidateProduct } from '../src/test/test-product-utils';
import { TestUserData } from '../src/test/test-user-data';
import { testActiveFilter } from './common/test-active-filter';
import { testDeletedFilter } from './common/test-deleted-filter';
import { testPagination } from './common/test-pagination';
import {
  TestRequestFunction,
  getHTTPDeleteMethod,
  getHTTPGetMethod,
  getHTTPPatchMethod,
  getHTTPPostMethod,
} from './common/test-request-utils';
import { testTextFilter } from './common/test-text-filter';
describe('StockController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  let brandRepo: Repository<BrandEntity>;
  let productRepo: Repository<ProductEntity>;
  let userRepo: Repository<UserEntity>;
  let authenticationService: AuthenticationService;
  let userService: UserService;

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
    productRepo = app.get<Repository<ProductEntity>>(
      getRepositoryToken(ProductEntity),
    );
    authenticationService = app.get<AuthenticationService>(
      AuthenticationService,
    );
    userService = app.get<UserService>(UserService);
    userRepo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    await app.init();

    await setAuthentication();

    testDatabaseUtils = new TestDatabaseUtils(app);
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  describe('/products', () => {
    describe('/products (POST)', () => {
      it('should create product', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        const brands = await brandRepo.find();
        const expectedProductResults = [
          { id: 1, ...productData[0] },
          { id: 2, ...productData[1] },
          { id: 3, ...productData[2], active: false },
        ];
        await testDatabaseUtils.reset();

        const createdProducts = [
          await httpPost(
            '/products',
            productData[0],
            HttpStatus.CREATED,
            rootToken,
          ),
          await httpPost(
            '/products',
            productData[1],
            HttpStatus.CREATED,
            rootToken,
          ),
          await httpPost(
            '/products',
            productData[2],
            HttpStatus.CREATED,
            adminToken,
          ),
        ];

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredTables).toEqual(['products']);
        expect(changes.after.products).toHaveLength(3);

        expect(createdProducts).toHaveLength(3);
        testValidateProduct(createdProducts[0], expectedProductResults[0]);
        testValidateProduct(createdProducts[1], expectedProductResults[1]);
        testValidateProduct(createdProducts[2], expectedProductResults[2]);

        expectedProductResults[0]['brand'] = brands[0];
        expectedProductResults[1]['brand'] = brands[0];
        expectedProductResults[2]['brand'] = brands[1];
        testValidateProduct(
          changes.after.products[0],
          expectedProductResults[0],
        );
        testValidateProduct(
          changes.after.products[1],
          expectedProductResults[1],
        );
        testValidateProduct(
          changes.after.products[2],
          expectedProductResults[2],
        );
      });

      it('should fail when brand does not exists', async () => {
        const productData = TestProductData.dataForRepository;
        const data = { ...productData[0], brandId: 200 };

        await testDatabaseUtils.reset();

        const body = await httpPost(
          '/products',
          data,
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
          await httpPost('/products', productData[0], HttpStatus.UNAUTHORIZED);
        });
      });

      describe('authorization', () => {
        it('should not allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await httpPost(
            '/products',
            productData[0],
            HttpStatus.FORBIDDEN,
            userToken,
          );
        });
      });

      describe.each([
        ...getNameErrorDataList(
          TestProductData.dataForRepository[1],
          TestPurpose.create,
        ),
        ...getActiveErrorDataList(TestProductData.dataForRepository[1]),
      ])(
        '$property',
        ({ property, data, response, statusCode, description }) => {
          it(`should fail when ${property} is ${description}`, async () => {
            const brandData = TestBrandData.dataForRepository;
            await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
            await testDatabaseUtils.reset();

            const body = await httpPost(
              '/products',
              data,
              statusCode,
              rootToken,
            );

            const changes = await testDatabaseUtils.checkChanges();
            expect(changes.alteredDatabase).toBeFalsy();
            expect(body).toEqual(response);
          });
        },
      );

      describe.each([
        ...getNameAcceptableValues(
          TestProductData.dataForRepository[1],
          TestPurpose.create,
        ),
        ...getActiveAcceptableValues(TestProductData.dataForRepository[1]),
      ])('$property', ({ data, property, description }) => {
        it(`should validate when ${property} is ${description}`, async () => {
          const expectedResult = plainToInstance(CreateProductRequestDTO, {
            id: 1,
            ...data,
          });
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const brands = await brandRepo.find();
          await testDatabaseUtils.reset();

          const createdProduct = await httpPost(
            '/products',
            data,
            HttpStatus.CREATED,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          expect(changes.alteredTables).toStrictEqual(['products']);
          testValidateProduct(createdProduct, expectedResult);
          expect(changes.after.products).toHaveLength(1);
          testValidateProduct(createdProduct, expectedResult);
          expectedResult['brand'] = brands[0];
          testValidateProduct(changes.after.products[0], expectedResult);
        });
      });
    });

    describe('/products (PATCH)', () => {
      it('should update product', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          productData[2],
        ]);
        await testDatabaseUtils.reset();

        const data = {
          code: 'newcode',
          name: 'New Name',
          model: 'New Model',
          price: 3000,
          quantityInStock: 2000,
          active: true,
          brandId: 3,
        };
        const expectedResults = [
          { id: 1, ...productData[0] },
          { id: 2, ...data },
          { id: 3, ...productData[2], active: false, quantityInStock: 0 },
        ];

        const updatedProduct = await httpPatch(
          '/products/2',
          data,
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredTables).toEqual(['products']);

        testValidateProduct(updatedProduct, expectedResults[1]);
        expect(changes.after.products).toHaveLength(3);
        expectedResults[0]['brand'] = changes.after.brands[0];
        expectedResults[1]['brand'] = changes.after.brands[2];
        expectedResults[2]['brand'] = changes.after.brands[1];
        testValidateProduct(changes.after.products[0], expectedResults[0]);
        testValidateProduct(changes.after.products[1], expectedResults[1]);
        testValidateProduct(changes.after.products[2], expectedResults[2]);
      });

      it('should fail when brand does not exists', async () => {
        const productData = TestProductData.dataForRepository;
        const data = { ...productData[0], brandId: 200 };

        await testDatabaseUtils.reset();

        const body = await httpPatch(
          '/products/1',
          data,
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
          await productRepo.insert([productData[0], productData[1]]);
          await httpPatch(
            '/products/2',
            productData[2],
            HttpStatus.UNAUTHORIZED,
          );
        });
      });

      describe('authorization', () => {
        it('should not allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await productRepo.insert([productData[0], productData[1]]);
          await httpPatch(
            '/products/2',
            productData[2],
            HttpStatus.FORBIDDEN,
            userToken,
          );
        });
      });

      describe.each([
        ...getCodeErrorDataList(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
        ...getNameErrorDataList(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
        ...getModelErrorDataList(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
        ...getPriceErrorDataList(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
        ...getQuantityInStockErrorDataList(
          TestProductData.dataForRepository[1],
        ),
        ...getActiveErrorDataList(TestProductData.dataForRepository[1]),
        ...getBrandIdErrorDataList(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
      ])(
        '$property',
        ({ data, response, property, description, statusCode }) => {
          it(`should fail when ${property} is ${description}`, async () => {
            const brandData = TestBrandData.dataForRepository;
            await brandRepo.insert([brandData[0], brandData[1]]);
            const productData = TestProductData.dataForRepository;
            await productRepo.insert([productData[0], productData[1]]);
            await testDatabaseUtils.reset();

            const body = await httpPatch(
              '/products/2',
              data,
              statusCode,
              rootToken,
            );
            const changes = await testDatabaseUtils.checkChanges();

            expect(changes.alteredDatabase).toBeFalsy();
            expect(body).toEqual(response);
          });
        },
      );

      describe.each([
        ...getCodeAcceptableValues(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
        ...getNameAcceptableValues(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
        ...getModelAcceptableValues(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
        ...getPriceAcceptableValues(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
        ...getQuantityInStockAcceptableValues(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
        ...getActiveAcceptableValues(TestProductData.dataForRepository[1]),
        ...getBrandIdAcceptableValues(
          TestProductData.dataForRepository[1],
          TestPurpose.update,
        ),
      ])('$property', ({ property, data, description }) => {
        it(`should validate when ${property} is ${description}`, async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await productRepo.insert([
            productData[0],
            productData[1],
            productData[2],
          ]);
          const products = await productRepo.find();

          await testDatabaseUtils.reset();
          const productUpdateDTO = plainToInstance(
            UpdateProductRequestDTO,
            data,
          );
          const expectedProductResults = [
            plainToInstance(UpdateProductRequestDTO, {
              id: 1,
              ...productData[0],
            }),
            plainToInstance(UpdateProductRequestDTO, {
              id: 2,
              ...data,
              active: productUpdateDTO.active,
            }),
            plainToInstance(UpdateProductRequestDTO, {
              id: 3,
              ...productData[2],
              active: false,
            }),
          ];
          if (data[property] == null) {
            expectedProductResults[1][property] = products[1][property];
          }

          expectedProductResults[1].active = productUpdateDTO.active;

          const updatedProduct = await httpPatch(
            '/products/2',
            data,
            HttpStatus.OK,
            rootToken,
          );

          const changes = await testDatabaseUtils.checkChanges();
          // não altera a base para o registro selecionado com os valores recebidos
          if (data[property] === undefined) {
            expect(changes.alteredTables).toEqual([]);
          } else if (property == 'brandId' && description == 'min value') {
            expect(changes.alteredTables).toEqual([]);
          } else if (property == 'active' && description == 'null') {
            expect(changes.alteredTables).toEqual([]);
          } else if (property == 'active' && description == 'string false') {
            expect(changes.alteredTables).toEqual([]);
          } else if (property == 'active' && description == 'boolean false') {
            expect(changes.alteredTables).toEqual([]);
          } else {
            expect(changes.alteredTables).toEqual(['products']);
          }

          testValidateProduct(updatedProduct, expectedProductResults[1]);

          expect(changes.before.products).toHaveLength(3);
          expect(changes.after.products).toHaveLength(3);
          expectedProductResults[0]['brand'] = changes.before.brands[0];
          expectedProductResults[1]['brand'] = changes.before.brands.find(
            (brand) => expectedProductResults[1].brandId == brand.id,
          );
          expectedProductResults[2]['brand'] = changes.before.brands[1];
          testValidateProduct(
            changes.after.products[0],
            expectedProductResults[0],
          );
          testValidateProduct(
            changes.after.products[1],
            expectedProductResults[1],
          );
          testValidateProduct(
            changes.after.products[2],
            expectedProductResults[2],
          );
        });
      });
    });

    describe('/products (GET)', () => {
      function objectToJSON(object) {
        return JSON.parse(JSON.stringify(object));
      }

      describe('authentication', () => {
        it('should allow unauthenticated', async () => {
          await brandRepo.insert(TestBrandData.buildData(1));
          await productRepo.insert(TestProductData.buildData(1));
          await httpGet('/products', {}, HttpStatus.OK);
        });
      });

      describe('authorization', () => {
        it('should allow basic user', async () => {
          await brandRepo.insert(TestBrandData.buildData(1));
          await productRepo.insert(TestProductData.buildData(1));
          await httpGet('/products', {}, HttpStatus.OK, userToken);
        });

        it('should allow admin', async () => {
          await brandRepo.insert(TestBrandData.buildData(1));
          await productRepo.insert(TestProductData.buildData(1));
          await httpGet('/products', {}, HttpStatus.OK, adminToken);
        });

        it('should allow root', async () => {
          await brandRepo.insert(TestBrandData.buildData(1));
          await productRepo.insert(TestProductData.buildData(1));
          await httpGet('/products', {}, HttpStatus.OK, rootToken);
        });
      });

      it('should find products', async () => {
        await brandRepo.insert(TestBrandData.buildData(1));
        const productData: any = TestProductData.buildData(4);
        productData[0].active = false;
        productData[2].deletedAt = new Date();
        await productRepo.insert(productData);
        const products = (
          await productRepo.find({
            where: {
              active: true,
            },
            relations: { brand: true },
          })
        ).map((product) => {
          const plain = instanceToPlain(product);
          return plain;
        });

        const ret = await httpGet('/products', {}, HttpStatus.OK, rootToken);

        expect(ret).toEqual({
          count: 2,
          page: 1,
          pageSize: 12,
          results: objectToJSON(products),
        });
      });

      it('should return empty list', async () => {
        const ret = await httpGet('/products', {}, HttpStatus.OK, rootToken);

        expect(ret).toEqual({
          count: 0,
          page: 1,
          pageSize: 12,
          results: [],
        });
      });

      describe('filtering', () => {
        describe('query', () => {
          const createRegisters = async (textToAppend: string[]) => {
            await brandRepo.insert(TestBrandData.buildData(1));
            const productsData = TestProductData.buildData(textToAppend.length);
            for (let i = 0; i < textToAppend.length; i++) {
              productsData[i].name += textToAppend[i];
            }
            await productRepo.insert(productsData);
          };
          const getPageFromRepository = async (options: { query?: any }) => {
            const findManyOptions: any = { where: {}, skip: 0, take: 12 };
            if (options.query) {
              let query = options.query.replace(/\s+/g, ' ').trim();
              if (query) {
                findManyOptions.where.name = ILike(
                  '%' + query.replace(' ', '%') + '%',
                );
              }
            }
            findManyOptions.relations = { brand: true };
            return productRepo.findAndCount(findManyOptions);
          };
          const getPageFromAPI = async (
            queryParameters: { query?: ActiveFilter },
            httpStatus: number,
          ) => {
            return httpGet('/products', queryParameters, httpStatus, rootToken);
          };

          testTextFilter<ProductEntity>(
            createRegisters,
            getPageFromRepository,
            getPageFromAPI,
          );
        });

        describe('active', () => {
          const createRegisters = async (
            quantity: number,
            inactiveIds: number[],
          ) => {
            await brandRepo.insert(TestBrandData.buildData(1));
            const productsData = TestProductData.buildData(quantity);
            await productRepo.insert(productsData);
            await productRepo.update(inactiveIds, { active: false });
          };
          const getPagesFromRepository = async (where: { active?: any }) => {
            return productRepo.findAndCount({
              where,
              skip: 0,
              take: 12,
              relations: { brand: true },
            });
          };
          const getPagesFromAPI = async (
            queryParameters: { active?: ActiveFilter },
            httpStatus: number,
          ) => {
            return httpGet('/products', queryParameters, httpStatus, rootToken);
          };

          testActiveFilter<ProductEntity>(
            createRegisters,
            getPagesFromRepository,
            getPagesFromAPI,
          );
        });

        describe('deleted', () => {
          const createRegisters = async (
            quantity: number,
            deletedIds: number[],
          ) => {
            await brandRepo.insert(TestBrandData.buildData(1));
            const productsData = TestProductData.buildData(quantity);
            await productRepo.insert(productsData);
            await productRepo.update(deletedIds, { deletedAt: false });
          };
          const getPagesFromRepository = async (options: { deleted?: any }) => {
            const findManyOptions: any = {
              skip: 0,
              take: 12,
              where: {},
              relations: { brand: true },
            };
            if (options.deleted === true) {
              findManyOptions.withDeleted = true;
              findManyOptions.where.deletedAt = Not(IsNull());
            } else if (options.deleted == null) {
              findManyOptions.withDeleted = true;
            }
            return productRepo.findAndCount(findManyOptions);
          };
          const getPagesFromAPI = async (
            queryParameters: { deleted?: DeletedFilter },
            httpStatus: number,
          ) => {
            return httpGet('/products', queryParameters, httpStatus, rootToken);
          };

          testDeletedFilter<ProductEntity>(
            createRegisters,
            getPagesFromRepository,
            getPagesFromAPI,
          );
        });
      });

      describe('pagination', () => {
        const createRegisters = async (quantity: number) => {
          await brandRepo.insert(TestBrandData.buildData(1));
          return productRepo.insert(TestProductData.buildData(quantity));
        };
        const getPagesFromRepository = (options: {
          skip: number;
          take: number;
        }) => {
          const findManyOptions: any = {};
          if (options.skip) findManyOptions.skip = options.skip;
          if (options.take) findManyOptions.take = options.take;
          findManyOptions.relations = { brand: true };
          return productRepo.findAndCount(findManyOptions);
        };
        const getPagesFromAPI = (
          queryParameters: { page: number; pageSize: number },
          httpStatus: number,
        ) => {
          return httpGet('/products', queryParameters, httpStatus, rootToken);
        };

        testPagination<ProductEntity>(
          createRegisters,
          getPagesFromRepository,
          getPagesFromAPI,
        );
      });

      describe('combined parameters', () => {
        it('should return results filtered by all parameters', async () => {
          await brandRepo.insert(TestBrandData.buildData(1));
          const productsData: any = TestProductData.buildData(20);

          for (let i = 0; i < productsData.length; i++) {
            productsData[i].active = i == 2;
            if (i != 4) {
              productsData[i].deletedAt = new Date();
            }
          }

          await productRepo.insert(productsData);
          const pages = [
            await productRepo.find({
              skip: 0,
              take: 8,
              where: {
                active: false,
                deletedAt: Not(IsNull()),
              },
              relations: { brand: true },
              withDeleted: true,
            }),
            await productRepo.find({
              skip: 8,
              take: 8,
              where: {
                active: false,
                deletedAt: Not(IsNull()),
              },
              relations: { brand: true },
              withDeleted: true,
            }),
            await productRepo.find({
              skip: 16,
              take: 8,
              where: {
                active: false,
                deletedAt: Not(IsNull()),
              },
              relations: { brand: true },
              withDeleted: true,
            }),
          ];

          const ret = [
            await httpGet(
              '/products',
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
              '/products',
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
              '/products',
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
              '/products',
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

    describe('/products/productId (GET)', () => {
      it('should find product', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          { ...productData[2], active: false, quantityInStock: 5 },
        ]);
        await testDatabaseUtils.reset();

        const foundProduct = await httpGet(
          '/products/2',
          {},
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(foundProduct).toBeDefined();
        testValidateProduct(foundProduct, changes.after.products[1]);
      });

      it('should fail when product does not exists', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          { ...productData[2], active: false, quantityInStock: 5 },
        ]);
        await testDatabaseUtils.reset();

        const body = await httpGet(
          '/products/200',
          {},
          HttpStatus.NOT_FOUND,
          rootToken,
        );
        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual({
          error: 'Not Found',
          message: ProductMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      });

      describe('authentication', () => {
        it('should allow unauthenticated', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await productRepo.insert([
            productData[0],
            productData[1],
            productData[2],
          ]);
          await httpGet('/products/2', {}, HttpStatus.OK);
        });
      });

      describe('authorization', () => {
        it('should allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await productRepo.insert([
            productData[0],
            productData[1],
            productData[2],
          ]);
          await httpGet('/products/2', {}, HttpStatus.OK, userToken);
        });
      });
    });

    describe('/products/:productId (DELETE)', () => {
      it('should delete product', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          { ...productData[2], active: false, quantityInStock: 5 },
        ]);
        await testDatabaseUtils.reset();

        const response = await httpDelete(
          '/products/2',
          {},
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredTables).toEqual(['products']);
        expect(changes.after.products).toEqual([
          changes.before.products[0],
          changes.before.products[2],
        ]);
        expect(response).toEqual(new SuccessResponseDto());
        const allBrandsAfter = await brandRepo.find({ withDeleted: true });
        expect(allBrandsAfter.map((brand) => brand.id)).toEqual([1, 2, 3]);
      });

      it('should fail when product does not exists', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          { ...productData[2], active: false, quantityInStock: 5 },
        ]);
        await testDatabaseUtils.reset();

        const body = await httpDelete(
          '/products/200',
          {},
          HttpStatus.NOT_FOUND,
          rootToken,
        );
        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual({
          error: 'Not Found',
          message: ProductMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      });

      describe('authentication', () => {
        it('should not allow unauthenticated', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await productRepo.insert([
            productData[0],
            productData[1],
            productData[2],
          ]);
          await httpDelete('/products/2', {}, HttpStatus.UNAUTHORIZED);
        });
      });

      describe('authorization', () => {
        it('should not allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await productRepo.insert([
            productData[0],
            productData[1],
            productData[2],
          ]);
          await httpDelete('/products/2', {}, HttpStatus.FORBIDDEN, userToken);
        });
      });
    });
  });
});
