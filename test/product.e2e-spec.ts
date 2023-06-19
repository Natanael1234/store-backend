import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { FindManyOptions, In, IsNull, Not, Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';
import { Role } from '../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { CreateProductRequestDTO } from '../src/modules/stock/controllers/product/dtos/request/create-product/create-product.request.dto';
import { UpdateProductRequestDTO } from '../src/modules/stock/controllers/product/dtos/request/update-product/update-product.request.dto';
import { BrandMessage } from '../src/modules/stock/enums/messages/brand-messages/brand-messages.enum';
import { CategoryMessage } from '../src/modules/stock/enums/messages/category-messages/category-messages.enum';
import { ProductMessage } from '../src/modules/stock/enums/messages/product-messages/product-messages.enum';
import { ProductOrder } from '../src/modules/stock/enums/sort/product-order/product-order.enum';
import { BrandEntity } from '../src/modules/stock/models/brand/brand.entity';
import { ProductEntity } from '../src/modules/stock/models/product/product.entity';
import { CategoryRepository } from '../src/modules/stock/repositories/category.repository';
import { PaginationConfig } from '../src/modules/system/dtos/request/pagination/configs/pagination.config';
import { SuccessResponseDto } from '../src/modules/system/dtos/response/pagination/success.response.dto';
import { ActiveFilter } from '../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { UserService } from '../src/modules/user/services/user/user.service';
import { TestBrandData } from '../src/test/brand/test-brand-data';
import { TestCategoryData } from '../src/test/category/test-category-data';
import { TestDtoIdListFilter } from '../src/test/filtering/id-list-filter/test-dto-id-list-filter';
import { TestSortScenarioBuilder } from '../src/test/filtering/sort/test-service-sort-filter';
import { TestProductData } from '../src/test/product/test-product-data';
import {
  testValidateProduct,
  testValidateProductArray,
} from '../src/test/product/test-product-utils';
import { TestPurpose } from '../src/test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../src/test/test-data/test-active-data';
import {
  getCodeAcceptableValues,
  getCodeErrorDataList,
} from '../src/test/test-data/test-code-data';
import {
  getFKAcceptableValues,
  getFKErrorDataList,
} from '../src/test/test-data/test-fk-data';
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

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  let brandRepo: Repository<BrandEntity>;
  let categoryRepo: CategoryRepository;
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
    categoryRepo = app.get<CategoryRepository>(CategoryRepository);
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
        await brandRepo.insert(TestBrandData.dataForRepository);
        await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
        const productData = TestProductData.dataForRepository;
        const brands = await brandRepo.find();
        const categories = await categoryRepo.find();
        const expectedProductResults = [
          {
            id: 1,
            ...productData[0],
            brand: brands[0],
            category: categories[0],
          },
          {
            id: 2,
            ...productData[1],
            brand: brands[0],
            category: categories[0],
          },
          {
            id: 3,
            ...productData[2],
            active: false,
            brand: brands[1],
            category: categories[1],
          },
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

        testValidateProductArray(createdProducts, expectedProductResults);

        expectedProductResults[0]['brand'] = brands[0];
        expectedProductResults[1]['brand'] = brands[0];
        expectedProductResults[2]['brand'] = brands[1];
        testValidateProductArray(
          changes.after.products,
          expectedProductResults,
        );
      });

      it('should fail when brand does not exists', async () => {
        await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
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
          await brandRepo.insert(TestBrandData.dataForRepository);
          await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
          const productData = TestProductData.dataForRepository;
          await httpPost('/products', productData[0], HttpStatus.UNAUTHORIZED);
        });
      });

      describe('authorization', () => {
        it('should not allow basic user', async () => {
          await brandRepo.insert(TestBrandData.dataForRepository);
          await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
          const productData = TestProductData.dataForRepository;
          await httpPost(
            '/products',
            productData[0],
            HttpStatus.FORBIDDEN,
            userToken,
          );
        });
      });

      async function testCreateAccept(property: string, data: any) {
        const dto = plainToInstance(CreateProductRequestDTO, { ...data });
        const expected = { id: 1, ...data, [property]: dto[property] };
        await brandRepo.insert(TestBrandData.dataForRepository);
        await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
        expected['brand'] = await brandRepo.findOneBy({ id: 1 });
        expected['category'] = await categoryRepo.findOneBy({ id: 1 });
        await testDatabaseUtils.reset();

        const createdProduct = await httpPost(
          '/products',
          data,
          HttpStatus.CREATED,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredTables).toStrictEqual(['products']);
        testValidateProduct(createdProduct, expected);
        expect(changes.after.products).toHaveLength(1);
        testValidateProduct(createdProduct, expected);
        testValidateProduct(changes.after.products[0], expected);
      }

      async function testCreateReject(
        data: any,
        statusCode: number,
        response: any,
      ) {
        await brandRepo.insert(TestBrandData.dataForRepository);
        await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
        await testDatabaseUtils.reset();

        const body = await httpPost('/products', data, statusCode, rootToken);

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredDatabase).toBeFalsy();
        expect(body).toEqual(response);
      }

      describe('code', () => {
        const accepts = getCodeAcceptableValues({
          dtoData: TestProductData.dataForRepository[0],
          purpose: TestPurpose.create,
        });
        it.each(accepts)(
          'should accept create product request when code is $description',
          async ({ data }) => {
            await testCreateAccept('code', data);
          },
        );

        const rejects = getCodeErrorDataList({
          dtoData: TestProductData.dataForRepository[0],
          purpose: TestPurpose.create,
        });
        it.each(rejects)(
          'should reject create product request when code is $description',
          async ({ data, response, statusCode }) => {
            await testCreateReject(data, statusCode, response);
          },
        );
      });

      describe('name', () => {
        const accepts = getNameAcceptableValues({
          dtoData: TestProductData.dataForRepository[0],
          purpose: TestPurpose.create,
        });
        it.each(accepts)(
          'should accept create product request when name is $description',
          async ({ data }) => {
            await testCreateAccept('name', data);
          },
        );

        const rejects = getCodeErrorDataList({
          dtoData: TestProductData.dataForRepository[0],
          purpose: TestPurpose.create,
        });
        it.each(rejects)(
          'should reject create product request when name is $description',
          async ({ data, response, statusCode }) => {
            await testCreateReject(data, statusCode, response);
          },
        );
      });

      describe('model', () => {
        const accepts = getModelAcceptableValues({
          dtoData: TestProductData.dataForRepository[0],
          purpose: TestPurpose.create,
        });
        it.each(accepts)(
          'should accept create product request when model is $description',
          async ({ data }) => {
            await testCreateAccept('model', data);
          },
        );

        const rejects = getModelErrorDataList({
          dtoData: TestProductData.dataForRepository[0],
          purpose: TestPurpose.create,
        });
        it.each(rejects)(
          'should reject create product request when model is $description',
          async ({ data, response, statusCode }) => {
            await testCreateReject(data, statusCode, response);
          },
        );
      });

      describe('price', () => {
        const accepts = getPriceAcceptableValues({
          dtoData: TestProductData.dataForRepository[0],
          purpose: TestPurpose.create,
        });
        it.each(accepts)(
          'should accept create product request when price is $description',
          async ({ data }) => {
            await testCreateAccept('price', data);
          },
        );

        const rejects = getPriceErrorDataList({
          dtoData: TestProductData.dataForRepository[0],
          purpose: TestPurpose.create,
        });
        it.each(rejects)(
          'should reject create product request when price is $description',
          async ({ data, response, statusCode }) => {
            await testCreateReject(data, statusCode, response);
          },
        );
      });

      describe('quantityInStock', () => {
        const accepts = getQuantityInStockAcceptableValues({
          dtoData: TestProductData.dataForRepository[0],
          purpose: TestPurpose.create,
        });
        it.each(accepts)(
          'should accept create product request when quantityInStock is $description',
          async ({ data }) => {
            await testCreateAccept('quantityInStock', data);
          },
        );

        const rejects = getQuantityInStockErrorDataList({
          dtoData: TestProductData.dataForRepository[0],
        });
        it.each(rejects)(
          'should reject create product request when quantityInStock is $description',
          async ({ data, response, statusCode }) => {
            await testCreateReject(data, statusCode, response);
          },
        );
      });

      describe('active', () => {
        const accepts = getActiveAcceptableValues({
          dtoData: TestProductData.dataForRepository[0],
        });
        it.each(accepts)(
          'should accept create product request when active is $description',
          async ({ data }) => {
            await testCreateAccept('active', data);
          },
        );

        const rejects = getActiveErrorDataList({
          dtoData: TestProductData.dataForRepository[0],
        });
        it.each(rejects)(
          'should reject create product request when active is $description',
          async ({ data, response, statusCode }) => {
            await testCreateReject(data, statusCode, response);
          },
        );
      });

      describe('brandId', () => {
        const accepts = getFKAcceptableValues({
          property: 'brandId',
          dtoData: TestProductData.dataForRepository[0],
          allowUndefined: false,
          allowNull: false,
        });
        it.each(accepts)(
          'should accept create product request when brandId is $description',
          async ({ data }) => {
            await testCreateAccept('brandId', data);
          },
        );

        const rejects = getFKErrorDataList({
          property: 'brandId',
          dtoData: TestProductData.dataForRepository[0],
          allowUndefined: false,
          allowNull: false,
          messages: {
            invalid: BrandMessage.BRAND_ID_TYPE,
            type: BrandMessage.BRAND_ID_TYPE,
            undefined: BrandMessage.REQUIRED_BRAND_ID,
            null: BrandMessage.NULL_BRAND_ID,
          },
        });
        it.each(rejects)(
          'should reject create product request when brandId is $description',
          async ({ data, response, statusCode }) => {
            await testCreateReject(data, statusCode, response);
          },
        );

        it('should reject create product request when brand is not found', async () => {
          await testCreateReject(
            { ...TestProductData.dataForRepository[0], brandId: 200 },
            HttpStatus.NOT_FOUND,
            {
              error: 'Not Found',
              message: BrandMessage.NOT_FOUND,
              statusCode: HttpStatus.NOT_FOUND,
            },
          );
        });
      });

      describe('categoryId', () => {
        const accepts = getFKAcceptableValues({
          property: 'categoryId',
          dtoData: TestProductData.dataForRepository[0],
          allowUndefined: false,
          allowNull: false,
        });
        it.each(accepts)(
          'should accept create product request when categoryId is $description',
          async ({ data }) => {
            await testCreateAccept('categoryId', data);
          },
        );

        const rejects = getFKErrorDataList({
          property: 'categoryId',
          dtoData: TestProductData.dataForRepository[0],
          allowUndefined: false,
          allowNull: false,
          messages: {
            invalid: CategoryMessage.CATEGORY_ID_TYPE,
            type: CategoryMessage.CATEGORY_ID_TYPE,
            undefined: CategoryMessage.REQUIRED_CATEGORY_ID,
            null: CategoryMessage.NULL_CATEGORY_ID,
          },
        });

        it.each(rejects)(
          'should reject create product request when categoryId is $description',
          async ({ data, response, statusCode }) => {
            await testCreateReject(data, statusCode, response);
          },
        );

        it('should reject create product request when category is not found', async () => {
          await testCreateReject(
            { ...TestProductData.dataForRepository[0], categoryId: 200 },
            HttpStatus.NOT_FOUND,
            {
              error: 'Not Found',
              message: CategoryMessage.NOT_FOUND,
              statusCode: HttpStatus.NOT_FOUND,
            },
          );
        });
      });
    });

    describe('/products (PATCH)', () => {
      it('should update product', async () => {
        const brandsData = TestBrandData.dataForRepository.slice(0, 3);
        await brandRepo.insert(brandsData);
        const categoriesData = TestCategoryData.dataForRepository;
        await categoryRepo.bulkCreate(categoriesData);
        const productData = TestProductData.dataForRepository.slice(0, 3);
        await productRepo.insert(productData);
        await testDatabaseUtils.reset();
        const data = {
          code: 'newcode',
          name: 'New Name',
          model: 'New Model',
          price: 3000,
          quantityInStock: 2000,
          active: true,
          brandId: 3,
          categoryId: 3,
        };

        const expected = await productRepo.find({
          relations: { brand: true, category: true },
        });

        expected[1].code = data.code;
        expected[1].name = data.name;
        expected[1].model = data.model;
        expected[1].price = data.price;
        expected[1].quantityInStock = data.quantityInStock;
        expected[1].active = data.active;
        expected[1].brandId = data.brandId;
        expected[1].categoryId = data.categoryId;
        expected[1].brand = await brandRepo.findOneBy({ id: 3 });
        expected[1].category = await categoryRepo.findOneBy({ id: 3 });

        const updated = await httpPatch(
          '/products/2',
          data,
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredTables).toEqual(['products']);
        testValidateProduct(updated, expected[1]);
        testValidateProductArray(changes.after.products, expected);
      });

      describe('authentication', () => {
        it('should not allow unauthenticated', async () => {
          await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
          await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
          const productData = TestProductData.dataForRepository.slice(0, 2);
          await productRepo.insert(productData);
          await httpPatch(
            '/products/2',
            productData[2],
            HttpStatus.UNAUTHORIZED,
          );
        });
      });

      describe('authorization', () => {
        it('should not allow basic user', async () => {
          await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
          await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
          const productData = TestProductData.dataForRepository.slice(0, 3);
          await productRepo.insert([productData[0], productData[1]]);
          await httpPatch(
            '/products/2',
            productData[2],
            HttpStatus.FORBIDDEN,
            userToken,
          );
        });
      });

      async function testUpdateAccept(property, data, description) {
        await brandRepo.insert(TestBrandData.dataForRepository);
        await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);

        const productsData = TestProductData.dataForRepository.slice(0, 3);
        await productRepo.insert(productsData);

        await testDatabaseUtils.reset();

        const dto = plainToInstance(UpdateProductRequestDTO, data);
        const expected = await productRepo.find({
          relations: { brand: true, category: true },
        });

        if (dto[property] !== undefined) {
          expected[1][property] = dto[property];
          if (property == 'brandId') {
            expected[1].brand = await brandRepo.findOneBy({
              id: dto[property],
            });
          }
          if (property == 'categoryId') {
            expected[1].category = await categoryRepo.findOneBy({
              id: dto[property],
            });
          }
        }

        // ensures register alteration
        if (property != 'name') {
          data.name = 'New Name';
          expected[1].name = data.name;
        } else if (property != 'code') {
          data.code = 'new code';
          expected[1].code = data.code;
        }

        const updated = await httpPatch(
          '/products/2',
          data,
          HttpStatus.OK,
          rootToken,
        );

        const changes = await testDatabaseUtils.checkChanges();
        expect(changes.alteredTables).toEqual(['products']);
        testValidateProduct(updated, expected[1]);
        expect(changes.after.products).toHaveLength(3);
        testValidateProductArray(changes.after.products, expected);
      }

      async function testUpdateReject(data, statusCode, response) {
        await brandRepo.insert(TestBrandData.dataForRepository);
        await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
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
      }

      describe('code', () => {
        const accepts = getCodeAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        });
        it.each(accepts)(
          'should accept update product request when code is $description',
          async ({ property, data, description }) => {
            await testUpdateAccept(property, data, description);
          },
        );

        const rejects = getCodeErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        });
        it.each(rejects)(
          'should reject update product request when code is $description',
          async ({ data, statusCode, response }) => {
            await testUpdateReject(data, statusCode, response);
          },
        );
      });

      describe('name', () => {
        const accepts = getNameAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        });
        it.each(accepts)(
          'should accept update product request when name is $description',
          async ({ property, data, description }) => {
            await testUpdateAccept(property, data, description);
          },
        );

        const rejects = getNameErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        });
        it.each(rejects)(
          'should reject update product request when name is $description',
          async ({ data, statusCode, response }) => {
            await testUpdateReject(data, statusCode, response);
          },
        );
      });

      describe('model', () => {
        const accepts = getModelAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        });
        it.each(accepts)(
          'should accept update product request when model is $description',
          async ({ property, data, description }) => {
            await testUpdateAccept(property, data, description);
          },
        );

        const rejects = getModelErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        });
        it.each(rejects)(
          'should reject update product request when model is $description',
          async ({ data, statusCode, response }) => {
            await testUpdateReject(data, statusCode, response);
          },
        );
      });

      describe('price', () => {
        const accepts = getPriceAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        });
        it.each(accepts)(
          'should accept update product request when price is $description',
          async ({ property, data, description }) => {
            await testUpdateAccept(property, data, description);
          },
        );

        const rejects = getPriceErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        });

        it.each(rejects)(
          'should reject update product request when price is $description',
          async ({ data, statusCode, response }) => {
            await testUpdateReject(data, statusCode, response);
          },
        );
      });

      describe('quantityInStock', () => {
        const accepts = [
          getQuantityInStockAcceptableValues({
            dtoData: TestProductData.dataForRepository[1],
            purpose: TestPurpose.update,
          }),
        ];
        it.each(accepts)(
          'should accept update product request when quantityInStock is $description',
          async ({ property, data, description }) => {
            await testUpdateAccept(property, data, description);
          },
        );

        const rejects = [
          getQuantityInStockErrorDataList({
            dtoData: TestProductData.dataForRepository[1],
          }),
        ];
        it.each(rejects)(
          'should reject update product request when quantityInStock is $description',
          async ({ data, statusCode, response }) => {
            await testUpdateReject(data, statusCode, response);
          },
        );
      });

      describe('active', () => {
        const accepts = [
          getActiveAcceptableValues({
            dtoData: TestProductData.dataForRepository[1],
          }),
        ];
        it.each(accepts)(
          'should accept update product request when active is $description',
          async ({ property, data, description }) => {
            await testUpdateAccept(property, data, description);
          },
        );

        const rejects = [
          getActiveErrorDataList({
            dtoData: TestProductData.dataForRepository[1],
          }),
        ];
        it.each(rejects)(
          'should reject update product request when active is $description',
          async ({ data, statusCode, response }) => {
            await testUpdateReject(data, statusCode, response);
          },
        );
      });

      describe('brandId', () => {
        const accepts = getFKAcceptableValues({
          property: 'brandId',
          dtoData: TestProductData.dataForRepository[1],
          allowUndefined: true,
          allowNull: false,
        });
        it.each(accepts)(
          'should accept update product request when brandId is $description',
          async ({ property, data, description }) => {
            await testUpdateAccept(property, data, description);
          },
        );

        const rejects = getFKErrorDataList({
          property: 'brandId',
          dtoData: TestProductData.dataForRepository[1],
          allowUndefined: true,
          allowNull: false,
          messages: {
            invalid: BrandMessage.BRAND_ID_TYPE,
            type: BrandMessage.BRAND_ID_TYPE,
            undefined: BrandMessage.REQUIRED_BRAND_ID,
            null: BrandMessage.NULL_BRAND_ID,
          },
        });
        it.each(rejects)(
          'should reject update product request when brandId is $description',
          async ({ data, statusCode, response }) => {
            await testUpdateReject(data, statusCode, response);
          },
        );

        it('should reject update product request when brand does not exists', async () => {
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
      });

      describe('categoryId', () => {
        const accepts = getFKAcceptableValues({
          property: 'categoryId',
          dtoData: TestProductData.dataForRepository[1],
          allowUndefined: true,
          allowNull: false,
        });
        it.each(accepts)(
          'should accept update product request when categoryId is $description',
          async ({ property, data, description }) => {
            await testUpdateAccept(property, data, description);
          },
        );

        const rejects = [
          getFKErrorDataList({
            property: 'categoryId',
            dtoData: TestProductData.dataForRepository[1],
            allowUndefined: true,
            allowNull: false,
            messages: {
              invalid: CategoryMessage.CATEGORY_ID_TYPE,
              type: CategoryMessage.CATEGORY_ID_TYPE,
              undefined: CategoryMessage.REQUIRED_CATEGORY_ID,
              null: CategoryMessage.NULL_CATEGORY_ID,
            },
          }),
        ];
        it.each(rejects)(
          'should reject update product request when categoryId is $description',
          async ({ data, statusCode, response }) => {
            await testUpdateReject(data, statusCode, response);
          },
        );

        it('should reject update product request when caategory does not exists', async () => {
          const productData = TestProductData.dataForRepository;
          const data = { ...productData[0], categoryId: 200 };

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
      });
    });

    describe('/products (GET)', () => {
      describe('authentication', () => {
        it('should allow unauthenticated', async () => {
          await brandRepo.insert(TestBrandData.buildData(1));
          await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
          await productRepo.insert(TestProductData.buildData(1));
          await httpGet('/products', {}, HttpStatus.OK);
        });
      });

      describe('authorization', () => {
        it('should allow basic user', async () => {
          await brandRepo.insert(TestBrandData.buildData(1));
          await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
          await productRepo.insert(TestProductData.buildData(1));
          await httpGet('/products', {}, HttpStatus.OK, userToken);
        });

        it('should allow admin', async () => {
          await brandRepo.insert(TestBrandData.buildData(1));
          await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
          await productRepo.insert(TestProductData.buildData(1));
          await httpGet('/products', {}, HttpStatus.OK, adminToken);
        });

        it('should allow root', async () => {
          await brandRepo.insert(TestBrandData.buildData(1));
          await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
          await productRepo.insert(TestProductData.buildData(1));
          await httpGet('/products', {}, HttpStatus.OK, rootToken);
        });
      });

      it('should find products', async () => {
        await brandRepo.insert(TestBrandData.buildData(1));
        await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
        const productData: any = TestProductData.buildData(4);
        productData[0].active = false;
        productData[2].deletedAt = new Date();
        await productRepo.insert(productData);
        const products = (
          await productRepo.find({
            where: { active: true },
            relations: { brand: true, category: true },
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

      describe('query parameters', () => {
        describe('text query', () => {
          class ProductTestTextFilter extends AbstractTestAPITextFilter<ProductEntity> {
            async insertRegisters(textToAppend: string[]) {
              await brandRepo.insert(TestBrandData.buildData(1));
              await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);

              const productsData = TestProductData.buildData(
                textToAppend.length,
              );
              for (let i = 0; i < textToAppend.length; i++) {
                productsData[i].name = textToAppend[i];
              }
              await productRepo.insert(productsData);
            }

            findRegisters(findManyOptions: FindManyOptions<ProductEntity>) {
              findManyOptions.relations = { brand: true, category: true };
              findManyOptions.order = { name: 'ASC' };
              return productRepo.findAndCount(findManyOptions);
            }

            getPagesFromAPI(
              queryParameters: { query?: any },
              httpStatus: number,
            ) {
              return httpGet(
                '/products',
                queryParameters,
                httpStatus,
                rootToken,
              );
            }
          }

          new ProductTestTextFilter().executeTests();
        });

        describe('active', () => {
          class TestProductActiveFilter extends AbstractTestAPIActiveFilter<ProductEntity> {
            async insertRegisters(actives: boolean[]): Promise<any> {
              await brandRepo.insert(TestBrandData.buildData(1));
              await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
              const productsData: any = TestProductData.buildData(
                actives.length,
              );
              for (let i = 0; i < actives.length; i++) {
                productsData[i].active = !!actives[i];
              }
              await productRepo.insert(productsData);
            }

            findRegisters(
              findManyOptions: FindManyOptions<ProductEntity>,
            ): Promise<[pages: ProductEntity[], count: number]> {
              findManyOptions.relations = { brand: true, category: true };
              findManyOptions.order = { name: 'ASC' };
              return productRepo.findAndCount(findManyOptions);
            }

            getPagesFromAPI(
              queryParameters: { active?: any },
              httpStatus: number,
            ): Promise<{
              count: number;
              page: number;
              pageSize: number;
              results: ProductEntity[];
            }> {
              return httpGet(
                '/products',
                queryParameters,
                httpStatus,
                rootToken,
              );
            }
          }

          new TestProductActiveFilter().executeTests();
        });

        describe('deleted', () => {
          class ProductTestDeletedFilter extends AbstractTestAPIDeletedFilter<ProductEntity> {
            async insertRegisters(deleteds: boolean[]) {
              await brandRepo.insert(TestBrandData.buildData(1));
              await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
              const productsData = TestProductData.buildData(deleteds.length);
              for (let i = 0; i < productsData.length; i++) {
                if (deleteds[i]) {
                  productsData[i].deletedAt = new Date();
                }
              }
              await productRepo.insert(productsData);
            }

            findRegisters(findManyOptions: FindManyOptions<ProductEntity>) {
              findManyOptions.relations = { brand: true, category: true };
              findManyOptions.order = { name: 'ASC' };
              return productRepo.findAndCount(findManyOptions);
            }

            getPagesFromAPI(
              queryParameters: { deleted?: any },
              httpStatus: number,
            ) {
              return httpGet(
                '/products',
                queryParameters,
                httpStatus,
                rootToken,
              );
            }
          }

          new ProductTestDeletedFilter().executeTests();
        });

        async function createRelationsTestScenario() {
          await brandRepo.insert(TestBrandData.dataForRepository);
          await categoryRepo.insert(TestCategoryData.dataForRepository);
          const productData = TestProductData.buildData(3);
          productData[1].categoryId = 2;
          productData[2].brandId = 2;
          await productRepo.insert(productData);
        }

        describe('categoryIds', () => {
          it('should filter products by categoryIds', async () => {
            await createRelationsTestScenario();
            const expectedResults = (
              await productRepo.find({
                where: { categoryId: 1 },
                relations: { category: true, brand: true },
              })
            ).map((product) => objectToJSON(product));

            const serviceCategories = await httpGet(
              '/products',
              { active: ActiveFilter.ALL, categoryIds: [1].join(',') },
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
          });

          const idlistTests = new TestDtoIdListFilter({
            onlyQueryParameters: true,
            messages: {
              propertyLabel: 'categoryId',
              invalidMessage: CategoryMessage.INVALID_CATEGORY_ID_LIST,
              invalidItemMessage: CategoryMessage.INVALID_CATEGORY_ID_LIST_ITEM,
              requiredItemMessage: CategoryMessage.NULL_CATEGORY_ID_LIST_ITEM,
            },
            customOptions: {
              description: 'category options',
              allowUndefined: true,
              allowNull: true,
              allowNullItem: false,
            },
          });
          const { accepts, rejects } = idlistTests.getTestData();

          it.each(accepts)(
            'should filter products when categoryIds=$test.description',
            async ({ test }) => {
              await createRelationsTestScenario();

              const findManyOptions: FindManyOptions<ProductEntity> = {
                where: {},
                relations: { category: true, brand: true },
                order: { name: 'ASC' },
              };

              if (test.normalizedData) {
                findManyOptions.where['categoryId'] = In(test.normalizedData);
              }
              const products = (await productRepo.find(findManyOptions)).map(
                (category) => objectToJSON(category),
              );

              const results = await httpGet(
                '/products',
                {
                  active: ActiveFilter.ALL,
                  categoryIds: test.data,
                  orderBy: [ProductOrder.NAME_ASC].join(','),
                },
                HttpStatus.OK,
                rootToken,
              );

              expect(results).toEqual({
                count: products.length,
                page: 1,
                pageSize: 12,
                results: products,
              });
            },
          );

          it.each(rejects)('$description', async ({ test, message }) => {
            await createRelationsTestScenario();
            const apiResult = await httpGet(
              '/products',
              { active: ActiveFilter.ALL, categoryIds: test.data },
              HttpStatus.UNPROCESSABLE_ENTITY,
              rootToken,
            );

            expect(apiResult).toEqual({
              error: 'UnprocessableEntityException',
              message: { categoryIds: message },
              statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            });
          });
        });

        describe('brandIds', () => {
          it('should filter products by brandIds', async () => {
            await createRelationsTestScenario();
            const expectedResults = (
              await productRepo.find({
                where: { brandId: 1 },
                relations: { category: true, brand: true },
              })
            ).map((product) => objectToJSON(product));

            const serviceCategories = await httpGet(
              '/products',
              { active: ActiveFilter.ALL, brandIds: [1].join(',') },
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
          });

          const idlistTests = new TestDtoIdListFilter({
            onlyQueryParameters: true,
            messages: {
              propertyLabel: 'brandId',
              invalidMessage: BrandMessage.INVALID_BRAND_ID_LIST,
              invalidItemMessage: BrandMessage.INVALID_BRAND_ID_LIST_ITEM,
              requiredItemMessage: BrandMessage.NULL_BRAND_ID_LIST_ITEM,
            },
            customOptions: {
              description: 'brand options',
              allowUndefined: true,
              allowNull: true,
              allowNullItem: false,
            },
          });
          const { accepts, rejects } = idlistTests.getTestData();

          it.each(accepts)(
            'should filter products when brandIds=$test.description',
            async ({ test }) => {
              await createRelationsTestScenario();

              const findManyOptions: FindManyOptions<ProductEntity> = {
                where: {},
                relations: { category: true, brand: true },
                order: { name: 'ASC' },
              };

              if (test.normalizedData) {
                findManyOptions.where['brandId'] = In(test.normalizedData);
              }
              const products = (await productRepo.find(findManyOptions)).map(
                (product) => objectToJSON(product),
              );

              const results = await httpGet(
                '/products',
                {
                  active: ActiveFilter.ALL,
                  brandIds: test.data,
                  orderBy: [ProductOrder.NAME_ASC].join(','),
                },
                HttpStatus.OK,
                rootToken,
              );

              expect(results).toEqual({
                count: products.length,
                page: 1,
                pageSize: 12,
                results: products,
              });
            },
          );

          it.each(rejects)('$description', async ({ test, message }) => {
            await createRelationsTestScenario();
            const apiResult = await httpGet(
              '/products',
              { active: ActiveFilter.ALL, brandIds: test.data },
              HttpStatus.UNPROCESSABLE_ENTITY,
              rootToken,
            );

            expect(apiResult).toEqual({
              error: 'UnprocessableEntityException',
              message: { brandIds: message },
              statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            });
          });
        });

        describe('pagination', () => {
          class ProductTestPagination extends AbstractTestApiPagination<ProductEntity> {
            async insertRegisters(quantity: number): Promise<any> {
              await brandRepo.insert(TestBrandData.buildData(1));
              await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
              return productRepo.insert(TestProductData.buildData(quantity));
            }

            findRegisters(findManyOptions: FindManyOptions<ProductEntity>) {
              findManyOptions.relations = { brand: true, category: true };
              findManyOptions.order = { name: 'ASC' };
              return productRepo.findAndCount(findManyOptions);
            }

            getPagesFromAPI(
              queryParameters: { page?: any; pageSize?: any },
              httpStatus: number,
            ) {
              return httpGet(
                '/products',
                queryParameters,
                httpStatus,
                rootToken,
              );
            }
          }

          new ProductTestPagination().executeTests();
        });

        describe('sort', () => {
          const { accepts, rejects } = new TestSortScenarioBuilder<
            typeof ProductOrder
          >(ProductOrder, [ProductOrder.NAME_ASC], 'api').getTests();

          const productsData = [];
          for (let name of ['Product 1', 'Product 2']) {
            for (let active of [true, false]) {
              for (let i = 1; i <= 2; i++) {
                productsData.push({
                  code: `CODE ${i + 1}`,
                  name,
                  model: `Model ${i + 1}`,
                  price: 100,
                  quantityInStock: 5,
                  active,
                  brandId: 1,
                  categoryId: 1,
                });
              }
            }
          }

          it.each(accepts)(
            `should order results when orderBy=$description`,
            async ({ orderBySQL, orderBy }) => {
              // prepare
              await brandRepo.insert(TestBrandData.buildData(1));

              await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
              await productRepo.insert(productsData);
              const repositoryResults = await productRepo.find({
                order: orderBySQL,
                take: PaginationConfig.DEFAULT_PAGE_SIZE,
                relations: { brand: true, category: true },
              });

              // execute
              const apiResult = await httpGet(
                '/products',
                { orderBy: orderBy, active: ActiveFilter.ALL },
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

          it.each(rejects)(
            'should fail when orderBy=$description',
            async ({ orderBy, expectedErrorResult }) => {
              // prepare
              await brandRepo.insert(TestBrandData.buildData(1));
              await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
              await productRepo.insert(productsData);

              // execute
              const apiResult = await httpGet(
                '/products',
                { orderBy, active: ActiveFilter.ALL },
                expectedErrorResult.statusCode,
                rootToken,
              );

              expect(apiResult).toEqual(expectedErrorResult);
            },
          );
        });

        describe('combined parameters', () => {
          it('should return results filtered by all parameters', async () => {
            await brandRepo.insert(TestBrandData.buildData(1));
            await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
            const productsData: any = TestProductData.buildData(20);

            for (let i = 0; i < productsData.length; i++) {
              productsData[i].active = i == 2;
              if (i != 4) {
                productsData[i].deletedAt = new Date();
              }
            }

            await productRepo.insert(productsData);
            const repositoryResults = [
              await productRepo.find({
                skip: 0,
                take: 8,
                where: {
                  active: false,
                  deletedAt: Not(IsNull()),
                },
                order: { name: 'DESC' },
                relations: { brand: true, category: true },
                withDeleted: true,
              }),
              await productRepo.find({
                skip: 8,
                take: 8,
                where: {
                  active: false,
                  deletedAt: Not(IsNull()),
                },
                order: { name: 'DESC' },
                relations: { brand: true, category: true },
                withDeleted: true,
              }),
              await productRepo.find({
                skip: 16,
                take: 8,
                where: {
                  active: false,
                  deletedAt: Not(IsNull()),
                },
                order: { name: 'DESC' },
                relations: { brand: true, category: true },
                withDeleted: true,
              }),
            ];

            const apiResults = [
              await httpGet(
                '/products',
                {
                  page: 1,
                  pageSize: 8,
                  deleted: DeletedFilter.DELETED,
                  active: ActiveFilter.INACTIVE,
                  orderBy: [ProductOrder.NAME_DESC].join(','),
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
                  orderBy: [ProductOrder.NAME_DESC].join(','),
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
                  orderBy: [ProductOrder.NAME_DESC].join(','),
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
                  orderBy: [ProductOrder.NAME_DESC].join(','),
                },
                HttpStatus.OK,
                rootToken,
              ),
            ];

            expect(apiResults[0]).toEqual({
              count: 18,
              page: 1,
              pageSize: 8,
              results: objectToJSON(repositoryResults[0]),
            });

            expect(apiResults[1]).toEqual({
              count: 18,
              page: 2,
              pageSize: 8,
              results: objectToJSON(repositoryResults[1]),
            });

            expect(apiResults[2]).toEqual({
              count: 18,
              page: 3,
              pageSize: 8,
              results: objectToJSON(repositoryResults[2]),
            });

            expect(apiResults[3]).toEqual({
              count: 18,
              page: 4,
              pageSize: 8,
              results: [],
            });
          });
        });
      });
    });

    describe('/products/productId (GET)', () => {
      it('should find product', async () => {
        await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
        await categoryRepo.bulkCreate(TestBrandData.dataForRepository);
        await productRepo.insert(TestProductData.dataForRepository.slice(0, 3));
        const productData = TestProductData.dataForRepository.slice(0, 3);
        productData[2].active = false;
        productData[2].quantityInStock = 5;
        await productRepo.insert(productData);

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
        await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
        await categoryRepo.bulkCreate(TestBrandData.dataForRepository);
        await productRepo.insert(TestProductData.dataForRepository.slice(0, 3));
        const productData = TestProductData.dataForRepository.slice(0, 3);
        productData[2].active = false;
        productData[2].quantityInStock = 5;
        await productRepo.insert(productData);

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
          await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
          await categoryRepo.bulkCreate(TestBrandData.dataForRepository);
          await productRepo.insert(
            TestProductData.dataForRepository.slice(0, 3),
          );
          await httpGet('/products/2', {}, HttpStatus.OK);
        });
      });

      describe('authorization', () => {
        it('should allow basic user', async () => {
          await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
          await categoryRepo.bulkCreate(TestBrandData.dataForRepository);
          await productRepo.insert(
            TestProductData.dataForRepository.slice(0, 3),
          );
          await httpGet('/products/2', {}, HttpStatus.OK, userToken);
        });
      });
    });

    describe('/products/:productId (DELETE)', () => {
      it('should delete product', async () => {
        await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
        await categoryRepo.bulkCreate(TestBrandData.dataForRepository);
        const productsData = TestProductData.dataForRepository.slice(0, 3);
        productsData[2].active = false;
        productsData[2].quantityInStock = 5;
        await productRepo.insert(productsData);
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
        await categoryRepo.bulkCreate(TestBrandData.dataForRepository);
        await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
        const productsData = TestProductData.dataForRepository.slice(0, 3);
        productsData[2].active = false;
        productsData[2].quantityInStock = 5;
        await productRepo.insert(productsData);
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
          await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
          await categoryRepo.bulkCreate(TestBrandData.dataForRepository);
          await productRepo.insert(
            TestProductData.dataForRepository.slice(0, 3),
          );
          await httpDelete('/products/2', {}, HttpStatus.UNAUTHORIZED);
        });
      });

      describe('authorization', () => {
        it('should not allow basic user', async () => {
          await brandRepo.insert(TestBrandData.dataForRepository.slice(0, 3));
          await categoryRepo.bulkCreate(TestBrandData.dataForRepository);
          await productRepo.insert(
            TestProductData.dataForRepository.slice(0, 3),
          );
          await httpDelete('/products/2', {}, HttpStatus.FORBIDDEN, userToken);
        });
      });
    });
  });
});
