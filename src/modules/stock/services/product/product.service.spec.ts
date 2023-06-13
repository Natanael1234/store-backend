import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestBrandData } from '../../../../test/brand/test-brand-data';
import { TestCategoryData } from '../../../../test/category/test-category-data';
import { AbstractTestServiceActiveFilter } from '../../../../test/filtering/active/test-service-active-filter';
import { AbstractTestServiceDeletedFilter } from '../../../../test/filtering/deleted/test-service-deleted-filter';
import { AbestractTestServicePagination } from '../../../../test/filtering/pagination/test-service-pagination-filter';
import { TestSortScenarioBuilder } from '../../../../test/filtering/sort/test-service-sort-filter';
import { AbstractTestServiceTextFilter } from '../../../../test/filtering/text/test-service-text-filter';
import { TestProductData } from '../../../../test/product/test-product-data';
import {
  testValidateProduct,
  testValidateProductArray,
} from '../../../../test/product/test-product-utils';
import { TestPurpose } from '../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../test/test-data/test-active-data';

import { TestDtoIdListFilter } from '../../../../test/filtering/id-list-filter/test-dto-id-list-filter';
import {
  getCodeAcceptableValues,
  getCodeErrorDataList,
} from '../../../../test/test-data/test-code-data';
import {
  getFKAcceptableValues,
  getFKErrorDataList,
} from '../../../../test/test-data/test-fk-data';
import {
  getModelAcceptableValues,
  getModelErrorDataList,
} from '../../../../test/test-data/test-model-data';
import {
  getNameAcceptableValues,
  getNameErrorDataList,
} from '../../../../test/test-data/test-name-data';
import {
  getPriceAcceptableValues,
  getPriceErrorDataList,
} from '../../../../test/test-data/test-price-data';
import {
  getQuantityInStockAcceptableValues,
  getQuantityInStockErrorDataList,
} from '../../../../test/test-data/test-quantity-in-stock-data';
import { PaginationConfig } from '../../../system/dtos/request/pagination/configs/pagination.config';
import { SuccessResponseDto } from '../../../system/dtos/response/pagination/success.response.dto';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { SortMessage } from '../../../system/enums/messages/sort-messages/sort-messages.enum';
import { CreateProductRequestDTO } from '../../controllers/product/dtos/request/create-product/create-product.request.dto';
import { FindProductRequestDTO } from '../../controllers/product/dtos/request/find-products/find-products.request.dto';
import { UpdateProductRequestDTO } from '../../controllers/product/dtos/request/update-product/update-product.request.dto';
import { BrandMessage } from '../../enums/messages/brand-messages/brand-messages.enum';
import { CategoryMessage } from '../../enums/messages/category-messages/category-messages.enum';
import { ProductMessage } from '../../enums/messages/product-messages/product-messages.enum';
import { ProductOrder } from '../../enums/sort/product-order/product-order.enum';
import { BrandEntity } from '../../models/brand/brand.entity';
import { ProductEntity } from '../../models/product/product.entity';
import { CategoryRepository } from '../../repositories/category.repository';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let productService: ProductService;
  let module: TestingModule;
  let brandRepo: Repository<BrandEntity>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<ProductEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<BrandEntity>>(
      getRepositoryToken(BrandEntity),
    );
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<ProductEntity>>(
      getRepositoryToken(ProductEntity),
    );
    productService = module.get<ProductService>(ProductService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

  describe('create', () => {
    it('should create product', async () => {
      const brandData = TestBrandData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      const productData = TestProductData.dataForRepository;
      await brandRepo.insert(brandData);
      await categoryRepo.bulkCreate(categoryData);
      const expectedBrands = await brandRepo.find();
      const expectedCategories = await categoryRepo.find();
      const expectedProducts = [
        {
          id: 1,
          ...productData[0],
          brand: expectedBrands[0],
          category: expectedCategories[0],
        },
        {
          id: 2,
          ...productData[1],
          brand: expectedBrands[0],
          category: expectedCategories[0],
        },
        {
          id: 3,
          ...productData[2],
          active: false,
          brand: expectedBrands[1],
          category: expectedCategories[1],
        },
      ];

      const dtos = [
        plainToInstance(CreateProductRequestDTO, productData[0]),
        plainToInstance(CreateProductRequestDTO, productData[1]),
        plainToInstance(CreateProductRequestDTO, productData[2]),
      ];
      const created = [
        await productService.create(dtos[0]),
        await productService.create(dtos[1]),
        await productService.create(dtos[2]),
      ];

      testValidateProductArray(created, expectedProducts);

      const products = await productRepo.find({
        relations: { brand: true, category: true },
      });

      expect(products).toHaveLength(3);
      testValidateProductArray(products, expectedProducts);
    });

    async function testCreateAccept(data: any, property: string) {
      const brandData = TestBrandData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      await brandRepo.insert(brandData[0]);
      await categoryRepo.insert(categoryData);

      const brands = await brandRepo.find();
      const categories = await categoryRepo.find();

      const dto = plainToInstance(CreateProductRequestDTO, data);
      const expectedResult = {
        id: 1,
        ...data,
        [property]: dto[property],
        brand: brands[0],
        category: categories[0],
      };

      const createdProduct = await productService.create(data);

      expectedResult.active = dto.active;
      testValidateProduct(createdProduct, expectedResult);

      const products = await productRepo.find({
        relations: { brand: true, category: true },
      });
      expect(products).toHaveLength(1);
      expectedResult.brand = brands[0];
      testValidateProduct(products[0], expectedResult);
    }

    async function testCreateReject(data: any, ExceptionClass, response: any) {
      const brandData = TestBrandData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      await brandRepo.insert(brandData[0]);
      await categoryRepo.insert(categoryData);

      const productDto = plainToInstance(CreateProductRequestDTO, data);
      const fn = () => productService.create(productDto);
      await expect(fn()).rejects.toThrow(ExceptionClass);
      expect(await productRepo.count()).toEqual(0);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual(response);
      }
    }

    describe('code', () => {
      const accepts = getCodeAcceptableValues({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      });
      it.each(accepts)(
        `should accept create product when code is $description`,
        async ({ data, property }) => {
          await testCreateAccept(data, property);
        },
      );

      const errors = getCodeErrorDataList({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      });
      it.each(errors)(
        'should reject create product when code is $description',
        async ({ data, ExceptionClass, response }) => {
          await testCreateReject(data, ExceptionClass, response);
        },
      );
    });

    describe('name', () => {
      it.each(
        getNameAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.create,
        }),
      )(
        `should accept create product when name is $description`,
        async ({ data, property }) => {
          await testCreateAccept(data, property);
        },
      );

      it.each(
        getNameErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.create,
        }),
      )(
        'should reject create product when name is $description',
        async ({ data, ExceptionClass, response }) => {
          await testCreateReject(data, ExceptionClass, response);
        },
      );
    });

    describe('price', () => {
      it.each(
        getPriceAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.create,
        }),
      )(
        `should accept create product when price is $description`,
        async ({ data, property }) => {
          await testCreateAccept(data, property);
        },
      );

      it.each(
        getPriceErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.create,
        }),
      )(
        'should reject create product when price is $description',
        async ({ data, ExceptionClass, response }) => {
          await testCreateReject(data, ExceptionClass, response);
        },
      );
    });

    describe('quantityInStock', () => {
      it.each(
        getQuantityInStockAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.create,
        }),
      )(
        `should accept create product when quantityInStock is $description`,
        async ({ data, property }) => {
          await testCreateAccept(data, property);
        },
      );

      it.each(
        getQuantityInStockErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
        }),
      )(
        'should reject create product when quantityInStock is $description',
        async ({ data, ExceptionClass, response }) => {
          await testCreateReject(data, ExceptionClass, response);
        },
      );
    });

    describe('active', () => {
      it.each(
        getActiveAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
        }),
      )(
        `should accept create product when active is $description`,
        async ({ data, property }) => {
          await testCreateAccept(data, property);
        },
      );

      it.each(
        getActiveErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
        }),
      )(
        'should reject to create product when active is $description',
        async ({ data, ExceptionClass, response }) => {
          await testCreateReject(data, ExceptionClass, response);
        },
      );
    });

    describe('brandId', () => {
      it.each(
        getFKAcceptableValues({
          property: 'brandId',
          dtoData: TestProductData.dataForRepository[1],
          allowUndefined: false,
          allowNull: false,
        }),
      )(
        `should accept create product when brandId is $description`,
        async ({ data, property }) => {
          await testCreateAccept(data, property);
        },
      );

      it.each(
        getFKErrorDataList({
          property: 'brandId',
          dtoData: TestProductData.dataForRepository[1],
          allowUndefined: false,
          allowNull: false,
          messages: {
            invalid: BrandMessage.BRAND_ID_TYPE,
            type: BrandMessage.BRAND_ID_TYPE,
            undefined: BrandMessage.REQUIRED_BRAND_ID,
            null: BrandMessage.NULL_BRAND_ID,
          },
        }),
      )(
        'should reject create product when brandId is $description',
        async ({ data, ExceptionClass, response }) => {
          await testCreateReject(data, ExceptionClass, response);
        },
      );

      it('should reject create product when brand does not exists', async () => {
        await testCreateReject(
          { ...TestProductData.dataForRepository[1], brandId: 200 },
          NotFoundException,
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
        dtoData: TestProductData.dataForRepository[1],
        allowUndefined: false,
        allowNull: false,
      });
      it.each(accepts)(
        `should create product when categoryId is $description`,
        async ({ data, property }) => {
          await testCreateAccept(data, property);
        },
      );

      const rejects = getFKErrorDataList({
        property: 'categoryId',
        dtoData: TestProductData.dataForRepository[1],
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
        'should reject create product when categoryId is $description',
        async ({ data, ExceptionClass, response }) => {
          await testCreateReject(data, ExceptionClass, response);
        },
      );

      it('should reject create product when category is not found', async () => {
        await testCreateReject(
          { ...TestProductData.dataForRepository[1], categoryId: 200 },
          NotFoundException,
          {
            error: 'Not Found',
            message: CategoryMessage.NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
          },
        );
      });
    });
  });

  describe('update', () => {
    async function createUpdateScenario() {
      const brandData = TestBrandData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      const productData = TestProductData.dataForRepository;

      const insertedBrands = await brandRepo.insert(brandData);
      const insertdCategories = await categoryRepo.insert(categoryData);
      const insertedProducts = await productRepo.insert(productData);

      const brands = await brandRepo.find();
      const categories = await categoryRepo.find();
      const products = await productRepo.find({
        relations: { brand: true, category: true },
      });

      return {
        brandData,
        categoryData,
        productData,
        createdBrand: insertedBrands,
        createdCategory: insertdCategories,
        createdProduct: insertedProducts,
        brands,
        categories,
        products,
      };
    }

    it('should update product', async () => {
      const {
        brands: expectedBrands,
        categories: expectedCategories,
        products: expectedProducts,
      } = await createUpdateScenario();

      const newData = {
        code: 'newcode',
        name: 'New Name',
        model: 'New Model',
        price: 500,
        quantityInStock: 600,
        active: true,
        brandId: 3,
        categoryId: 3,
      };

      expectedProducts[1].code = newData.code;
      expectedProducts[1].name = newData.name;
      expectedProducts[1].model = newData.model;
      expectedProducts[1].price = newData.price;
      expectedProducts[1].quantityInStock = newData.quantityInStock;
      expectedProducts[1].active = newData.active;
      expectedProducts[1].brandId = newData.brandId;
      expectedProducts[1].categoryId = newData.categoryId;
      expectedProducts[1].brand = expectedBrands[2];
      expectedProducts[1].category = expectedCategories[2];

      const dto = plainToInstance(UpdateProductRequestDTO, newData);
      const updated = await productService.update(2, dto);

      testValidateProduct(updated, expectedProducts[1]);

      const products = await productRepo.find({
        relations: { brand: true, category: true },
      });

      expect(products).toHaveLength(3);

      testValidateProductArray(products, expectedProducts);
    });

    async function testUpdateError(
      data: any,
      ExceptionClass,
      response: {
        error: string;
        message: any;
        statusCode: HttpStatus;
      },
    ) {
      await createUpdateScenario();

      const productDto = plainToInstance(UpdateProductRequestDTO, data);

      const fn = () => productService.update(2, productDto);
      await expect(fn()).rejects.toThrow(ExceptionClass);

      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual(response);
      }
    }

    async function testUpdateAccept(property, value?) {
      await createUpdateScenario();
      const expected = await productRepo.find({
        relations: { brand: true, category: true },
      });
      const data = { [property]: value };
      const dto = plainToInstance(UpdateProductRequestDTO, data);

      if (dto[property] !== undefined) {
        expected[1][property] = dto[property];
      }

      const updated = await productService.update(2, data);

      testValidateProduct(updated, expected[1]);
      expect(expected).toHaveLength(3);
      const products = await productRepo.find({
        relations: { brand: true, category: true },
      });
      testValidateProductArray(products, expected);
    }

    describe('code', () => {
      it.each(
        getCodeAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        }),
      )(
        `should accept to update product when code is $description`,
        async ({ data }) => {
          await testUpdateAccept('code', data.code);
        },
      );

      it.each(
        getCodeErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        }),
      )(
        `should reject to update product when code is $description`,
        async ({ data, ExceptionClass, response }) => {
          await testUpdateError(data, ExceptionClass, response);
        },
      );
    });

    describe('name', () => {
      it.each(
        getNameAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        }),
      )(
        `should accept to update product when name is $description`,
        async ({ data }) => {
          await testUpdateAccept('name', data.name);
        },
      );

      it.each(
        getNameErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        }),
      )(
        `should reject to update product when name is $description`,
        async ({ data, ExceptionClass, response }) => {
          await testUpdateError(data, ExceptionClass, response);
        },
      );
    });

    describe('model', () => {
      it.each(
        getModelAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        }),
      )(
        `should accept to update product when model is $description`,
        async ({ data }) => {
          await testUpdateAccept('model', data.nome);
        },
      );

      it.each(
        getModelErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        }),
      )(
        `should reject to update product when model is $description`,
        async ({ data, ExceptionClass, response }) => {
          await testUpdateError(data, ExceptionClass, response);
        },
      );
    });

    describe('price', () => {
      it.each(
        getPriceAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        }),
      )(
        `should accept to update product when price is $description`,
        async ({ data }) => {
          await testUpdateAccept('price', data.price);
        },
      );

      it.each(
        getPriceErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        }),
      )(
        `should reject to update product when price is $description`,
        async ({ data, ExceptionClass, response }) => {
          await testUpdateError(data, ExceptionClass, response);
        },
      );
    });

    describe('quantityInStock', () => {
      it.each(
        getQuantityInStockAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
          purpose: TestPurpose.update,
        }),
      )(
        `should accept to update product when quantityInStock is $description`,
        async ({ data }) =>
          await testUpdateAccept('quantityInStock', data.quantityInStock),
      );

      it.each(
        getQuantityInStockErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
        }),
      )(
        `should reject to update product when quantityInStock is $description`,
        async ({ data, ExceptionClass, response }) => {
          await testUpdateError(data, ExceptionClass, response);
        },
      );
    });

    describe('active', () => {
      it.each(
        getActiveAcceptableValues({
          dtoData: TestProductData.dataForRepository[1],
        }),
      )(
        `should accept to update product when active is $description`,
        async ({ data }) => await testUpdateAccept('active', data.active),
      );

      it.each(
        getActiveErrorDataList({
          dtoData: TestProductData.dataForRepository[1],
        }),
      )(
        `should reject to update product when active is $description`,
        async ({ data, ExceptionClass, response }) => {
          await testUpdateError(data, ExceptionClass, response);
        },
      );
    });

    describe('brandId', () => {
      it.each(
        getFKAcceptableValues({
          property: 'brandId',
          dtoData: TestProductData.dataForRepository[1],
          allowUndefined: true,
          allowNull: false,
        }),
      )(
        `should accept to update product when brandId is $description`,
        async ({ data }) => await testUpdateAccept('brandId', data.brandId),
      );

      it.each(
        getFKErrorDataList({
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
        }),
      )(
        'should reject to update product when brandId is $description',
        async ({ data, ExceptionClass, response }) => {
          await testUpdateError(data, ExceptionClass, response);
        },
      );

      it('should reject to update product when brand is not found', async () => {
        await testUpdateError({ brandId: 200 }, NotFoundException, {
          error: 'Not Found',
          message: BrandMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      });
    });

    describe('categoryId', () => {
      it.each(
        getFKAcceptableValues({
          property: 'categoryId',
          dtoData: TestCategoryData.dataForRepository[1],
          allowUndefined: true,
          allowNull: false,
        }),
      )(
        `should accept update product when categoryId is $description`,
        async ({ data }) =>
          await testUpdateAccept('categoryId', data.categoryId),
      );

      it.each(
        getFKErrorDataList({
          property: 'categoryId',
          dtoData: TestProductData.dataForRepository[1],
          allowUndefined: false,
          allowNull: false,
          messages: {
            invalid: CategoryMessage.CATEGORY_ID_TYPE,
            type: CategoryMessage.CATEGORY_ID_TYPE,
            undefined: CategoryMessage.CATEGORY_NAME_REQUIRED,
            null: CategoryMessage.NULL_CATEGORY_ID,
          },
        }),
      )(
        'should reject to update product when categoryId is $description',
        async ({ data, ExceptionClass, response }) => {
          await testUpdateError(data, ExceptionClass, response);
        },
      );
    });

    it('should reject to update product when category is not found', async () => {
      await testUpdateError({ categoryId: 200 }, NotFoundException, {
        error: 'Not Found',
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('find', () => {
    it('should find products', async () => {
      const brandData = TestBrandData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      const productData = TestProductData.dataForRepository;
      await brandRepo.insert(brandData);
      await categoryRepo.insert(categoryData);
      await productRepo.insert([
        productData[0],
        productData[1],
        productData[2],
      ]);
      const products = await productRepo.find({
        relations: { brand: true, category: true },
        take: 12,
        order: { name: 'ASC' },
      });

      const ret = await productService.find({});

      expect(ret).toEqual({
        count: 1,
        page: 1,
        pageSize: 12,
        results: [products[0]],
      });
    });

    it('should return empty list', async () => {
      const ret = await productService.find();
      expect(ret).toEqual({
        count: 0,
        page: 1,
        pageSize: 12,
        results: [],
      });
    });

    it('should find products without parameters and pagination dtos', async () => {
      await brandRepo.insert(TestBrandData.buildData(1));
      await categoryRepo.insert(TestCategoryData.buildData(1));
      const productData: any[] = TestProductData.buildData(15);

      productData[3].active = false;
      productData[4].deletedAt = new Date();
      await productRepo.insert(productData);

      const repositoryResults = await productRepo.find({
        where: { active: true },
        relations: { brand: true, category: true },
        take: 12,
        order: { name: 'ASC' },
      });

      const serviceResult = await productService.find();

      expect(serviceResult).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: repositoryResults,
      });
    });

    it('should return empty list', async () => {
      const ret = await productService.find();

      expect(ret).toEqual({
        count: 0,
        page: 1,
        pageSize: 12,
        results: [],
      });
    });

    describe('query parameters', () => {
      it.each([
        { description: 'null', data: null },
        { description: 'undefined', data: undefined },
      ])(
        'should use default values when dto is $description',
        async ({ data }) => {
          await brandRepo.insert(TestBrandData.buildData(1));
          await categoryRepo.insert(TestCategoryData.buildData(1));
          const productData: any[] = TestProductData.buildData(15);
          productData[3].active = false;
          productData[4].deletedAt = new Date();
          await productRepo.insert(productData);

          const repositoryResults = await productRepo.find({
            where: { active: true },
            relations: { brand: true, category: true },
            take: 12,
            order: { name: 'ASC' },
          });

          const serviceResult = await productService.find(data);

          expect(serviceResult).toEqual({
            count: 13,
            page: 1,
            pageSize: 12,
            results: repositoryResults,
          });
        },
      );

      describe('text query', () => {
        class TestServiceTextFilter extends AbstractTestServiceTextFilter<ProductEntity> {
          async insertViaRepository(texts: string[]) {
            await brandRepo.insert(TestBrandData.buildData(1));
            await categoryRepo.insert(TestCategoryData.buildData(1));
            const productsData: any = TestProductData.buildData(texts.length);
            for (let i = 0; i < productsData.length; i++) {
              productsData[i].name = texts[i];
            }
            await productRepo.insert(productsData);
          }

          findViaRepository(findManyOptions: FindManyOptions<any>) {
            findManyOptions.relations = { brand: true, category: true };
            return productRepo.findAndCount(findManyOptions);
          }

          findViaService(options?: { query?: string }) {
            return productService.find(options);
          }
        }

        new TestServiceTextFilter().executeTests();
      });

      describe('active', () => {
        class TestServiceActive extends AbstractTestServiceActiveFilter<ProductEntity> {
          async insertRegisters(actives: boolean[]) {
            await brandRepo.insert(TestBrandData.buildData(1));
            await categoryRepo.insert(TestCategoryData.buildData(1));
            const insertData: any = await TestProductData.buildData(
              actives.length,
            );
            for (let i = 0; i < actives.length; i++) {
              insertData[i].active = actives[i];
            }
            await productRepo.insert(insertData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.relations = { brand: true, category: true };
            return productRepo.findAndCount(findManyOptions);
          }

          findViaService(queryParameters?: FindProductRequestDTO) {
            return productService.find(queryParameters);
          }
        }

        new TestServiceActive().executeTests();
      });

      describe('deleted', () => {
        class TestServiceDeleted extends AbstractTestServiceDeletedFilter<ProductEntity> {
          async insertRegisters(deleteds: boolean[]) {
            await brandRepo.insert(TestBrandData.buildData(1));
            await categoryRepo.insert(TestCategoryData.buildData(1));
            const insertData: any = await TestProductData.buildData(
              deleteds.length,
            );
            for (let i = 0; i < deleteds.length; i++) {
              if (!!deleteds[i]) {
                insertData[i].deletedAt = new Date();
              }
            }
            await productRepo.insert(insertData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.relations = { brand: true, category: true };
            return productRepo.findAndCount(findManyOptions);
          }

          findViaService(queryParameters?: FindProductRequestDTO) {
            return productService.find(queryParameters);
          }
        }

        new TestServiceDeleted().executeTests();
      });

      describe('brandIds', () => {
        const idlistTests = new TestDtoIdListFilter({
          messages: {
            invalidMessage: BrandMessage.INVALID_BRAND_ID_LIST,
            invalidItemMessage: BrandMessage.INVALID_BRAND_ID_LIST_ITEM,
            requiredItemMessage: BrandMessage.NULL_BRAND_ID_LIST_ITEM,
          },
          customOptions: {
            description: 'category parent options',
            allowUndefined: true,
            allowNull: true,
            allowNullItem: false,
          },
        });
        const { accepts, rejects } = idlistTests.getTestData();

        it.each(accepts)(
          `Should filter products by brandIds = $test.description`,
          async ({ test }) => {
            await brandRepo.insert(TestBrandData.dataForRepository);
            await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
            await productRepo.insert(TestProductData.dataForRepository);

            const findManyOptions: FindManyOptions<ProductEntity> = {
              relations: {
                category: true,
                brand: true,
              },
            };
            if (test.normalizedData?.length) {
              findManyOptions.where = { brandId: In(test.normalizedData) };
            }
            const expected = await productRepo.find(findManyOptions);

            const results = await productService.find({
              active: ActiveFilter.ALL,
              brandIds: test.data,
              orderBy: [ProductOrder.ACTIVE_DESC],
            });
            expect(results).toEqual({
              count: expected.length,
              page: 1,
              pageSize: 12,
              results: expected,
            });
          },
        );

        it.each(rejects)(
          'should fail when brandId is $test.description',
          async (optionTest) => {
            await brandRepo.insert(TestBrandData.dataForRepository);
            await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
            await productRepo.insert(TestProductData.dataForRepository);

            const fn = () =>
              productService.find({
                active: ActiveFilter.ALL,
                brandIds: optionTest.test.data,
                orderBy: [ProductOrder.ACTIVE_DESC],
              });

            await expect(fn()).rejects.toThrow(UnprocessableEntityException);
            try {
              await fn();
            } catch (ex) {
              expect(ex.response).toEqual({
                error: 'UnprocessableEntityException',
                message: { brandIds: optionTest.message },
                statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
              });
            }
          },
        );
      });

      describe('categoryIds', () => {
        const idlistTests = new TestDtoIdListFilter({
          messages: {
            invalidMessage: CategoryMessage.INVALID_CATEGORY_ID_LIST,
            invalidItemMessage: CategoryMessage.INVALID_CATEGORY_ID_LIST_ITEM,
            requiredItemMessage: CategoryMessage.NULL_CATEGORY_ID_LIST_ITEM,
          },
          customOptions: {
            description: 'category parent options',
            allowUndefined: true,
            allowNull: true,
            allowNullItem: false,
          },
        });
        const { accepts, rejects } = idlistTests.getTestData();

        it.each(accepts)(
          `Should filter products when categoryIds = $test.description`,
          async ({ test }) => {
            await brandRepo.insert(TestBrandData.dataForRepository);
            await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
            await productRepo.insert(TestProductData.dataForRepository);

            const findManyOptions: FindManyOptions<ProductEntity> = {
              relations: {
                category: true,
                brand: true,
              },
            };
            if (test.normalizedData?.length) {
              findManyOptions.where = { categoryId: In(test.normalizedData) };
            }
            const expected = await productRepo.find(findManyOptions);

            const results = await productService.find({
              active: ActiveFilter.ALL,
              categoryIds: test.data,
              orderBy: [ProductOrder.ACTIVE_DESC],
            });
            expect(results).toEqual({
              count: expected.length,
              page: 1,
              pageSize: 12,
              results: expected,
            });
          },
        );

        it.each(rejects)(
          'should fail when categoryId is $test.description',
          async (optionTest) => {
            await brandRepo.insert(TestBrandData.dataForRepository);
            await categoryRepo.bulkCreate(TestCategoryData.dataForRepository);
            await productRepo.insert(TestProductData.dataForRepository);

            const fn = () =>
              productService.find({
                active: ActiveFilter.ALL,
                categoryIds: optionTest.test.data,
                orderBy: [ProductOrder.ACTIVE_DESC],
              });

            await expect(fn()).rejects.toThrow(UnprocessableEntityException);
            try {
              await fn();
            } catch (ex) {
              expect(ex.response).toEqual({
                error: 'UnprocessableEntityException',
                message: { categoryIds: optionTest.message },
                statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
              });
            }
          },
        );
      });

      describe('pagination', () => {
        class TestUserServicePagination extends AbestractTestServicePagination<ProductEntity> {
          async insertViaRepository(quantity: number) {
            await brandRepo.insert(TestBrandData.buildData(1));
            await categoryRepo.insert(TestCategoryData.buildData(1));
            await productRepo.insert(TestProductData.buildData(quantity));
          }

          findViaRepository(findManyOptions: FindManyOptions) {
            findManyOptions.relations = { brand: true, category: true };
            findManyOptions.order = { name: 'ASC' };
            return productRepo.findAndCount(findManyOptions);
          }

          findViaService(queryParameters?: FindProductRequestDTO) {
            return productService.find(queryParameters);
          }
        }

        new TestUserServicePagination().executeTests();
      });

      describe('sort', () => {
        const testSortScenario = new TestSortScenarioBuilder<
          typeof ProductOrder
        >(ProductOrder, [ProductOrder.NAME_ASC], 'api');

        const brandData = TestBrandData.buildData(1);
        const categoryData = TestCategoryData.buildData(1);
        const productData = [];
        for (let name of ['Product 1', 'Product 2']) {
          for (let active of [true, false]) {
            for (let i = 1; i <= 2; i++) {
              productData.push({
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

        it.each(testSortScenario.generateSuccessTestScenarios())(
          `should order results when orderBy=$description`,
          async ({ orderBySQL, orderBy }) => {
            // prepare
            await brandRepo.insert(brandData);
            await categoryRepo.insert(categoryData);
            await productRepo.insert(productData);

            const repositoryResults = await productRepo.find({
              relations: { brand: true, category: true },
              order: orderBySQL,
              take: PaginationConfig.DEFAULT_PAGE_SIZE,
            });

            // execute
            const apiResult = await productService.find({
              orderBy,
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

        it('should fail when receives invalid orderBy item string', async () => {
          // prepare
          await brandRepo.insert(brandData);
          await categoryRepo.insert(categoryData);
          await productRepo.insert(productData);

          // execute
          const fn = () =>
            productService.find({
              orderBy: [
                'invalid_impossible_and_never_gonna_happen' as ProductOrder,
              ],
              active: ActiveFilter.ALL,
            });

          await expect(fn()).rejects.toThrow(UnprocessableEntityException);

          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual({
              error: 'UnprocessableEntityException',
              message: { orderBy: SortMessage.INVALID },
              statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            });
          }
        });
      });

      describe('combined tests', () => {
        let brandsData; //= TestBrandData.buildData(20);
        beforeEach(async () => {
          brandsData = [];
          let j = 1;
          for (let i = 0; i < 4; i++) {
            for (let activeState of [true, false]) {
              for (let deletedAt of [null, new Date()]) {
                for (let text of ['EVEN', 'ODD']) {
                  brandsData.push({
                    name: `Brand ${j++} ${text}`,
                    active: activeState,
                    deletedAt,
                  });
                }
              }
            }
          }
          const ret = await brandRepo.save(brandsData);
        });

        async function testCombinedParameters(options: FindProductRequestDTO) {
          let { active, deleted, page, pageSize } = options;
          let query = 'EVEN';

          const where: FindOptionsWhere<ProductEntity> = {};
          const findManyOptions: FindManyOptions<ProductEntity> = { where };

          if (active == ActiveFilter.ACTIVE) {
            where.active = true;
          } else if (active == ActiveFilter.INACTIVE) {
            where.active = false;
          }

          if (deleted == DeletedFilter.ALL) {
            findManyOptions.withDeleted = true;
          } else if (deleted == DeletedFilter.DELETED) {
            findManyOptions.withDeleted = true;
            where.deletedAt = Not(IsNull());
          }

          page = Math.max(page || PaginationConfig.MIN_PAGE);
          pageSize = Math.max(
            pageSize || PaginationConfig.MIN_PAGE_SIZE,
            Math.min(pageSize, PaginationConfig.MAX_PAGE_SIZE),
          );
          findManyOptions.take = pageSize;
          findManyOptions.skip = (page - 1) * pageSize;

          where.name = ILike('%EVEN%');

          const [repositoryResults, count] = await productRepo.findAndCount(
            findManyOptions,
          );

          const serviceResult = await productService.find({
            query,
            active,
            deleted,
            page,
            pageSize,
          });

          expect(serviceResult).toEqual({
            count,
            page,
            pageSize,
            results: repositoryResults,
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
          'Should do text filtering when brand is $description',
          ({ description, active, deleted, pageSize }) => {
            it(`should get first page when`, async () => {
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
    it('should find product', async () => {
      const brandsData = TestBrandData.dataForRepository;
      const productsData = TestProductData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      await brandRepo.insert(brandsData);
      await categoryRepo.insert(categoryData);
      await productRepo.insert(productsData);

      const product = await productRepo.findOne({
        where: { id: 2 },
        relations: { brand: true, category: true },
      });

      const serviceProduct = await productService.findById(2);
      expect(serviceProduct).toBeDefined();
      testValidateProduct(serviceProduct, product);
    });

    it('should fail when productId is not defined', async () => {
      const brandsData = TestBrandData.dataForRepository;
      const productsData = TestProductData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      await brandRepo.insert(brandsData);
      await categoryRepo.insert(categoryData);
      await productRepo.insert(productsData);
      const productsBefore = await productRepo.find();

      const fn = () => productService.findById(null);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(await productRepo.find()).toStrictEqual(productsBefore);
      await expect(fn()).rejects.toThrow(ProductMessage.ID_REQUIRED);

      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Unprocessable Entity',
          message: ProductMessage.ID_REQUIRED,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail when product does not exists', async () => {
      const brandsData = TestBrandData.dataForRepository;
      const productsData = TestProductData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      await brandRepo.insert(brandsData);
      await categoryRepo.insert(categoryData);
      await productRepo.insert(productsData);
      const productsBefore = await productRepo.find();

      const fn = () => productService.findById(200);
      await expect(fn()).rejects.toThrow(NotFoundException);
      expect(await productRepo.find()).toStrictEqual(productsBefore);
      await expect(fn()).rejects.toThrow(ProductMessage.NOT_FOUND);

      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Not Found',
          message: ProductMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      const brandsData = TestBrandData.dataForRepository;
      const productsData = TestProductData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      await brandRepo.insert(brandsData);
      await categoryRepo.insert(categoryData);
      await productRepo.insert(productsData);
      const productsBefore = await productRepo.find();

      const retDelete = await productService.delete(2);
      expect(retDelete).toEqual(new SuccessResponseDto());

      const productsAfter = await productRepo.find();
      expect(productsAfter).toHaveLength(2);
      expect(productsAfter).toStrictEqual([
        productsBefore[0],
        productsBefore[2],
      ]);
      const allProductsAfter = await productRepo.find({ withDeleted: true });
      expect(allProductsAfter).toHaveLength(3);
      expect(allProductsAfter[0].id).toEqual(1);
      expect(allProductsAfter[1].id).toEqual(2);
      expect(allProductsAfter[2].id).toEqual(3);
    });

    it('should fail when productId is not defined', async () => {
      const brandsData = TestBrandData.dataForRepository;
      const productsData = TestProductData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      await brandRepo.insert(brandsData);
      await categoryRepo.insert(categoryData);
      await productRepo.insert(productsData);
      const productsBefore = await productRepo.find();

      const fn = () => productService.delete(null);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(await productRepo.find()).toStrictEqual(productsBefore);
      await expect(fn()).rejects.toThrow(ProductMessage.ID_REQUIRED);

      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Unprocessable Entity',
          message: ProductMessage.ID_REQUIRED,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail when product does not exists', async () => {
      const brandsData = TestBrandData.dataForRepository;
      const productsData = TestProductData.dataForRepository;
      const categoryData = TestCategoryData.dataForRepository;
      await brandRepo.insert(brandsData);
      await categoryRepo.insert(categoryData);
      await productRepo.insert(productsData);
      const productsBefore = await productRepo.find();

      const fn = () => productService.delete(200);
      await expect(fn()).rejects.toThrow(NotFoundException);
      expect(await productRepo.find()).toStrictEqual(productsBefore);
      await expect(fn()).rejects.toThrow(ProductMessage.NOT_FOUND);

      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Not Found',
          message: ProductMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
    });

    it.skip('should not delete if is active', async () => {});
  });
});
