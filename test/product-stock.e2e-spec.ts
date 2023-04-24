import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';

import { plainToInstance } from 'class-transformer';
import { Role } from '../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { CreateProductRequestDTO } from '../src/modules/stock/dtos/request/create-product/create-product.request.dto';
import { UpdateProductRequestDTO } from '../src/modules/stock/dtos/request/update-product/update-product.request.dto';
import { SuccessResponseDto } from '../src/modules/stock/dtos/response/success.response.dto';
import { BrandMessage } from '../src/modules/stock/enums/brand-messages/brand-messages.enum';
import { ProductMessage } from '../src/modules/stock/enums/product-messages/product-messages.enum';
import { BrandEntity } from '../src/modules/stock/models/brand/brand.entity';
import { ProductEntity } from '../src/modules/stock/models/product/product.entity';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { UserService } from '../src/modules/user/services/user/user.service';
import { TestBrandData } from '../src/test/test-brand-data';
import { TestDatabaseUtils } from '../src/test/test-database-utils';
import { TestProductData } from '../src/test/test-product-data';
import { testValidateProduct } from '../src/test/test-product-utils';
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

  describe('/stock/product', () => {
    describe('/stock/products (POST)', () => {
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
            '/stock/products',
            productData[0],
            HttpStatus.CREATED,
            rootToken,
          ),
          await httpPost(
            '/stock/products',
            productData[1],
            HttpStatus.CREATED,
            rootToken,
          ),
          await httpPost(
            '/stock/products',
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
          '/stock/products',
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
          await httpPost(
            '/stock/products',
            productData[0],
            HttpStatus.UNAUTHORIZED,
          );
        });
      });

      describe('authorization', () => {
        it('should not allow basic user', async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
          const productData = TestProductData.dataForRepository;
          await httpPost(
            '/stock/products',
            productData[0],
            HttpStatus.FORBIDDEN,
            userToken,
          );
        });
      });

      describe.each([
        ...TestProductData.getNameErrorDataList('create'),
        ...TestProductData.getActiveErrorDataList(),
      ])(
        '$property',
        ({ property, data, response, statusCode, description }) => {
          it(`should fail when ${property} is ${description}`, async () => {
            const brandData = TestBrandData.dataForRepository;
            await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
            await testDatabaseUtils.reset();

            const body = await httpPost(
              '/stock/products',
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
        ...TestProductData.getNameAcceptableValues('create'),
        ...TestProductData.getActiveAcceptableValues(),
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
            '/stock/products',
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

    describe('/stock/products (PATCH)', () => {
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
          '/stock/products/2',
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
          '/stock/products/1',
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
            '/stock/products/2',
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
            '/stock/products/2',
            productData[2],
            HttpStatus.FORBIDDEN,
            userToken,
          );
        });
      });

      describe.each([
        ...TestProductData.getCodeErrorDataList('update'),
        ...TestProductData.getNameErrorDataList('update'),
        ...TestProductData.getModelErrorDataList('update'),
        ...TestProductData.getPriceErrorDataList('update'),
        ...TestProductData.getQuantityInStockErrorDataList(),
        ...TestProductData.getActiveErrorDataList(),
        ...TestProductData.getBrandIdErrorDataList('update'),
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
              '/stock/products/2',
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
        ...TestProductData.getCodeAcceptableValues('update'),
        ...TestProductData.getNameAcceptableValues('update'),
        ...TestProductData.getModelAcceptableValues('update'),
        ...TestProductData.getPriceAcceptableValues('update'),
        ...TestProductData.getQuantityInStockAcceptableValues('update'),
        ...TestProductData.getActiveAcceptableValues(),
        ...TestProductData.getBrandIdAcceptableValues('update'),
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
            '/stock/products/2',
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

    describe('/stock/products (GET)', () => {
      it('should find products', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          { ...productData[2], active: false, quantityInStock: 5 },
        ]);
        await testDatabaseUtils.reset();

        const foundProducts = await httpGet(
          '/stock/products',
          {},
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(foundProducts).toHaveLength(3);
        testValidateProduct(foundProducts[0], changes.after.products[0]);
        testValidateProduct(foundProducts[1], changes.after.products[1]);
        testValidateProduct(foundProducts[2], changes.after.products[2]);
      });

      it('should return empty list', async () => {
        await testDatabaseUtils.reset();

        const foundProducts = await httpGet(
          '/stock/products',
          {},
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(foundProducts).toHaveLength(0);
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
          await httpGet('/stock/products', {}, HttpStatus.OK);
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
          await httpGet('/stock/products', {}, HttpStatus.OK, userToken);
        });
      });
    });

    describe('/stock/products/productId (GET)', () => {
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
          '/stock/products/2',
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
          '/stock/products/200',
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
          await httpGet('/stock/products/2', {}, HttpStatus.OK);
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
          await httpGet('/stock/products/2', {}, HttpStatus.OK, userToken);
        });
      });
    });

    describe('/stock/products/:productId (DELETE)', () => {
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
          '/stock/products/2',
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
          '/stock/products/200',
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
          await httpDelete('/stock/products/2', {}, HttpStatus.UNAUTHORIZED);
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
          await httpDelete(
            '/stock/products/2',
            {},
            HttpStatus.FORBIDDEN,
            userToken,
          );
        });
      });
    });

    describe('/stock/product/search (GET)', () => {
      it('should do textual search for products.', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          { ...productData[2], active: false, quantityInStock: 5 },
        ]);
        await testDatabaseUtils.reset();

        const results1 = await httpGet(
          '/stock/products/search',
          { query: 'duct 1' },
          HttpStatus.OK,
          rootToken,
        );
        const changes1 = await testDatabaseUtils.checkChanges();

        const results2 = await httpGet(
          '/stock/products/search',
          { query: 'Product' },
          HttpStatus.OK,
          rootToken,
        );
        const changes2 = await testDatabaseUtils.checkChanges();

        expect(changes1.alteredDatabase).toBeFalsy();
        expect(changes2.alteredDatabase).toBeFalsy();

        expect(results1).toHaveLength(1);
        testValidateProduct(results1[0], changes2.after.products[0]);
        expect(results2).toHaveLength(3);
        testValidateProduct(results2[0], changes2.after.products[0]);
        testValidateProduct(results2[1], changes2.after.products[1]);
        testValidateProduct(results2[2], changes2.after.products[2]);
      });

      it('should do textual search for products.', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          { ...productData[2], active: false, quantityInStock: 5 },
        ]);
        await testDatabaseUtils.reset();

        const results = await httpGet(
          '/stock/products/search',
          { query: 'not found text' },
          HttpStatus.OK,
          rootToken,
        );
        const changes = await testDatabaseUtils.checkChanges();

        expect(changes.alteredDatabase).toBeFalsy();
        expect(results).toHaveLength(0);
      });

      it('should fail when parameter is not string', async () => {
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
          '/stock/products/search',
          { query: {} },
          HttpStatus.UNPROCESSABLE_ENTITY,
          rootToken,
        );
        const changes = await testDatabaseUtils.checkChanges();

        expect(body).toEqual({
          error: 'Unprocessable Entity',
          message: 'Search must be string',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });

        expect(changes.alteredDatabase).toBeFalsy();
      });

      it('should fail when parameter is empty string', async () => {
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
          '/stock/products/search',
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
          const productData = TestProductData.dataForRepository;
          await productRepo.insert([
            productData[0],
            productData[1],
            productData[2],
          ]);
          await httpGet(
            '/stock/products/search',
            { query: 'duct 1' },
            HttpStatus.OK,
          );
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
          await httpGet(
            '/stock/products/search',
            { query: 'duct 1' },
            HttpStatus.OK,
            userToken,
          );
        });
      });
    });
  });
});
