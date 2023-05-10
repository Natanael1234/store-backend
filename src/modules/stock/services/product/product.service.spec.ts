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
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';

import { TestBrandData } from '../../../../test/brand/test-brand-data';
import { AbstractTestServiceActiveFilter } from '../../../../test/filtering/active/test-service-active-filter';
import { AbstractTestServiceDeletedFilter } from '../../../../test/filtering/deleted/test-service-deleted-filter';
import { AbestractTestServicePagination } from '../../../../test/filtering/pagination/test-service-pagination-filter';
import { TestSortScenarioBuilder } from '../../../../test/filtering/sort/test-service-sort-filter';
import { AbstractTestServiceTextFilter } from '../../../../test/filtering/text/test-service-text-filter';
import { TestProductData } from '../../../../test/product/test-product-data';
import { testValidateProduct } from '../../../../test/product/test-product-utils';
import { TestPurpose } from '../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../test/test-data/test-active-data';
import {
  getBrandIdAcceptableValues,
  getBrandIdErrorDataList,
} from '../../../../test/test-data/test-brand-id.-data';
import {
  getCodeAcceptableValues,
  getCodeErrorDataList,
} from '../../../../test/test-data/test-code-data';
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
import { CreateProductRequestDTO } from '../../dtos/request/create-product/create-product.request.dto';
import { FindProductRequestDTO } from '../../dtos/request/find-products/find-products.request.dto';
import { UpdateProductRequestDTO } from '../../dtos/request/update-product/update-product.request.dto';
import { BrandMessage } from '../../enums/messages/brand-messages/brand-messages.enum';
import { ProductMessage } from '../../enums/messages/product-messages/product-messages.enum';
import { ProductOrder } from '../../enums/sort/product-order/product-order.enum';
import { BrandEntity } from '../../models/brand/brand.entity';
import { ProductEntity } from '../../models/product/product.entity';
import { ProductService } from './product.service';

describe('StockService', () => {
  let productService: ProductService;
  let module: TestingModule;
  let brandRepo: Repository<BrandEntity>;
  let productRepo: Repository<ProductEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<BrandEntity>>(
      getRepositoryToken(BrandEntity),
    );
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

  describe('create product', () => {
    it('should create product', async () => {
      const brandData = TestBrandData.dataForRepository;
      const productData = TestProductData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const expectedBrandResults = [
        { id: 1, ...brandData[0] },
        { id: 2, ...brandData[1] },
        { id: 3, ...brandData[2] },
      ];
      const expectedProductResults = [
        { id: 1, ...productData[0] },
        { id: 2, ...productData[1] },
        { id: 3, ...productData[2], active: false },
      ];

      const productDtos = [
        plainToInstance(CreateProductRequestDTO, productData[0]),
        plainToInstance(CreateProductRequestDTO, productData[1]),
        plainToInstance(CreateProductRequestDTO, productData[2]),
      ];
      const createdProducts = [
        await productService.create(productDtos[0]),
        await productService.create(productDtos[1]),
        await productService.create(productDtos[2]),
      ];

      testValidateProduct(createdProducts[0], expectedProductResults[0]);
      testValidateProduct(createdProducts[1], expectedProductResults[1]);
      testValidateProduct(createdProducts[2], expectedProductResults[2]);

      const products = await productRepo.find({ relations: { brand: true } });

      expect(products).toHaveLength(3);
      expectedProductResults[0]['brand'] = expectedBrandResults[0];
      expectedProductResults[1]['brand'] = expectedBrandResults[0];
      expectedProductResults[2]['brand'] = expectedBrandResults[1];
      testValidateProduct(products[0], expectedProductResults[0]);
      testValidateProduct(products[1], expectedProductResults[1]);
      testValidateProduct(products[2], expectedProductResults[2]);
    });

    it('should fail if brand does not exists', async () => {
      const productData = TestProductData.dataForRepository;
      const productDto = plainToInstance(
        CreateProductRequestDTO,
        productData[0],
      );
      const fn = () => productService.create(productDto);
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow(BrandMessage.NOT_FOUND);
      expect(await productRepo.count()).toEqual(0);
    });

    describe.each([
      ...getCodeErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getNameErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getModelErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getPriceErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getQuantityInStockErrorDataList(TestProductData.dataForRepository[1]),
      ...getActiveErrorDataList(TestProductData.dataForRepository[1]),
      ...getBrandIdErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
    ])(
      '$property',
      ({ data, description, property, ExceptionClass, response }) => {
        it(`should fail when ${property} is ${description}`, async () => {
          const brandData = TestBrandData.dataForRepository;
          await brandRepo.insert(brandData[0]);

          const productDto = plainToInstance(CreateProductRequestDTO, data);
          const fn = () => productService.create(productDto);
          await expect(fn()).rejects.toThrow(ExceptionClass);
          expect(await productRepo.count()).toEqual(0);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual(response);
          }
        });
      },
    );

    describe.each([
      ...getCodeAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getNameAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getModelAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getPriceAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getQuantityInStockAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getActiveAcceptableValues(TestProductData.dataForRepository[1]),
      ...getBrandIdAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.create,
      ),
    ])('$property', ({ data, property, description }) => {
      it(`should validate when ${property} is ${description}`, async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        const brands = await brandRepo.find();

        const productDto = plainToInstance(CreateProductRequestDTO, data);
        const expectedResult = { id: 1, ...data };

        const createdProduct = await productService.create(productDto);

        expectedResult.active = productDto.active;
        testValidateProduct(createdProduct, expectedResult);

        const products = await productRepo.find({
          relations: { brand: true },
        });
        expect(products).toHaveLength(1);
        expectedResult.brand = brands[0];
        testValidateProduct(products[0], expectedResult);
      });
    });
  });

  describe('update product', () => {
    it('should update product', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const productData = TestProductData.dataForRepository;
      await productRepo.insert([
        productData[0],
        productData[1],
        productData[2],
      ]);

      const newData = {
        code: 'newcode',
        name: 'New Name',
        model: 'New Model',
        price: 500,
        quantityInStock: 600,
        active: true,
        brandId: 3,
      };

      const expectedBrandResults = [
        { id: 1, ...brandData[0] },
        { id: 2, ...brandData[1] },
        { id: 3, ...brandData[2] },
      ];
      const expectedProductResults = [
        { id: 1, ...productData[0] },
        { id: 2, ...newData },
        { id: 3, ...productData[2], active: false },
      ];

      const dto = plainToInstance(UpdateProductRequestDTO, newData);
      const updatedProduct = await productService.update(2, dto);

      testValidateProduct(updatedProduct, expectedProductResults[1]);

      const products = await productRepo.find({ relations: { brand: true } });

      expect(products).toHaveLength(3);
      expectedProductResults[0]['brand'] = expectedBrandResults[0];
      expectedProductResults[1]['brand'] = expectedBrandResults[2];
      expectedProductResults[2]['brand'] = expectedBrandResults[1];
      testValidateProduct(products[0], expectedProductResults[0]);
      testValidateProduct(products[1], expectedProductResults[1]);
      testValidateProduct(products[2], expectedProductResults[2]);
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
      ...getQuantityInStockErrorDataList(TestProductData.dataForRepository[1]),
      ...getActiveErrorDataList(TestProductData.dataForRepository[1]),
      ...getBrandIdErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    ])(
      '$property',
      ({ data, ExceptionClass, response, property, description }) => {
        it(`should fail when ${property} is ${description}`, async () => {
          const brandData = TestBrandData.dataForRepository;
          const productData = TestProductData.dataForRepository;

          await brandRepo.insert([brandData[0], brandData[1]]);
          await productRepo.insert([productData[0], productData[1]]);

          const productDto = plainToInstance(UpdateProductRequestDTO, data);

          const productsBefore = await productRepo.find();
          const fn = () => productService.update(2, productDto);
          await expect(fn()).rejects.toThrow(ExceptionClass);
          const productsAfter = await productRepo.find();
          expect(productsBefore).toStrictEqual(productsAfter);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual(response);
          }
        });
      },
    );

    describe.each([
      [
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
      ],
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
        const productsBefore = await productRepo.find();
        const expectedBrandResults = [
          { id: 1, ...brandData[0] },
          { id: 2, ...brandData[1] },
          { id: 3, ...brandData[2] },
        ];

        const productUpdateDTO = plainToInstance(UpdateProductRequestDTO, data);
        const expectedProductResults = [
          { id: 1, ...productData[0] },
          { id: 2, ...data, active: productUpdateDTO.active },
          { id: 3, ...productData[2], active: false },
        ];
        if (data[property] == null) {
          expectedProductResults[1][property] = productsBefore[1][property];
        }

        expectedProductResults[1].active = productUpdateDTO.active;
        const updatedProduct = await productService.update(2, productUpdateDTO);

        testValidateProduct(updatedProduct, expectedProductResults[1]);

        const productsAfter = await productRepo.find({
          relations: { brand: true },
        });

        expect(productsBefore).toHaveLength(3);
        expectedProductResults[0]['brand'] = expectedBrandResults[0];
        expectedProductResults[1]['brand'] = expectedBrandResults.find(
          (brand) => expectedProductResults[1].brandId == brand.id,
        );
        expectedProductResults[2]['brand'] = expectedBrandResults[1];
        testValidateProduct(productsAfter[0], expectedProductResults[0]);
        testValidateProduct(productsAfter[1], expectedProductResults[1]);
        testValidateProduct(productsAfter[2], expectedProductResults[2]);
      });
    });
  });

  describe('find', () => {
    it('should find products', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const productData = TestProductData.dataForRepository;
      await productRepo.insert([
        productData[0],
        productData[1],
        productData[2],
      ]);
      const products = await productRepo.find({
        relations: { brand: true },
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
      const productData: any[] = TestProductData.buildData(15);
      productData[3].active = false;
      productData[4].deletedAt = new Date();
      await productRepo.insert(productData);

      const repositoryResults = await productRepo.find({
        where: { active: true },
        relations: { brand: true },
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
          const productData: any[] = TestProductData.buildData(15);
          productData[3].active = false;
          productData[4].deletedAt = new Date();
          await productRepo.insert(productData);

          const repositoryResults = await productRepo.find({
            where: { active: true },
            relations: { brand: true },
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
            const productsData: any = TestProductData.buildData(texts.length);
            for (let i = 0; i < productsData.length; i++) {
              productsData[i].name = texts[i];
            }
            await productRepo.insert(productsData);
          }

          findViaRepository(findManyOptions: FindManyOptions<any>) {
            findManyOptions.relations = { brand: true };
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
            const insertData: any = await TestProductData.buildData(
              actives.length,
            );
            for (let i = 0; i < actives.length; i++) {
              insertData[i].active = actives[i];
            }
            await productRepo.insert(insertData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            findManyOptions.relations = { brand: true };
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
            findManyOptions.relations = { brand: true };
            return productRepo.findAndCount(findManyOptions);
          }

          findViaService(queryParameters?: FindProductRequestDTO) {
            return productService.find(queryParameters);
          }
        }

        new TestServiceDeleted().executeTests();
      });

      describe('pagination', () => {
        class TestUserServicePagination extends AbestractTestServicePagination<ProductEntity> {
          async insertViaRepository(quantity: number) {
            await brandRepo.insert(TestBrandData.buildData(1));
            await productRepo.insert(TestProductData.buildData(quantity));
          }

          findViaRepository(findManyOptions: FindManyOptions) {
            findManyOptions.relations = { brand: true };
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
              });
            }
          }
        }

        it.each(testSortScenario.generateSuccessTestScenarios())(
          `should order results when orderBy=$description`,
          async ({ orderBySQL, orderBy }) => {
            // prepare
            await brandRepo.insert(brandData);
            await productRepo.insert(productData);

            const repositoryResults = await productRepo.find({
              relations: { brand: true },
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
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const productData = TestProductData.dataForRepository;

      await productRepo.insert([
        productData[0],
        productData[1],
        productData[2],
      ]);
      const product = await productRepo.findOne({
        where: { id: 2 },
        relations: { brand: true },
      });

      const serviceProduct = await productService.findById(2);
      expect(serviceProduct).toBeDefined();
      testValidateProduct(serviceProduct, product);
    });

    it('should fail when productId is not defined', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const productData = TestProductData.dataForRepository;
      await productRepo.insert([
        productData[0],
        productData[1],
        productData[2],
      ]);
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
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const productData = TestProductData.dataForRepository;
      await productRepo.insert([
        productData[0],
        productData[1],
        productData[2],
      ]);
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
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const productData = TestProductData.dataForRepository;
      await productRepo.insert([
        productData[0],
        productData[1],
        productData[2],
      ]);
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
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const productData = TestProductData.dataForRepository;
      await productRepo.insert([
        productData[0],
        productData[1],
        productData[2],
      ]);
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
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const productData = TestProductData.dataForRepository;
      await productRepo.insert([
        productData[0],
        productData[1],
        productData[2],
      ]);
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
