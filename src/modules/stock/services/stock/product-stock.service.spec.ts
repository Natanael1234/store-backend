import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestBrandData } from '../../../../test/test-brand-data';
import { TestProductData } from '../../../../test/test-product-data';
import { testValidateProduct } from '../../../../test/test-product-utils';
import { CreateBrandRequestDTO } from '../../dtos/request/create-brand/create-brand.request.dto';
import { CreateProductRequestDTO } from '../../dtos/request/create-product/create-product.request.dto';
import { UpdateProductRequestDTO } from '../../dtos/request/update-product/update-product.request.dto';
import { SuccessResponseDto } from '../../dtos/response/success.response.dto';
import { BrandMessage } from '../../enums/brand-messages/brand-messages.enum';
import { ProductMessage } from '../../enums/product-messages/product-messages.enum';
import { BrandEntity } from '../../models/brand/brand.entity';
import { ProductEntity } from '../../models/product/product.entity';
import { StockService } from './stock.service';

describe('StockService', () => {
  let stockService: StockService;
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
    stockService = module.get<StockService>(StockService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(stockService).toBeDefined();
  });

  describe('product', () => {
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
          await stockService.createProduct(productDtos[0]),
          await stockService.createProduct(productDtos[1]),
          await stockService.createProduct(productDtos[2]),
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
        const fn = () => stockService.createProduct(productDto);
        await expect(fn()).rejects.toThrow(NotFoundException);
        await expect(fn()).rejects.toThrow(BrandMessage.NOT_FOUND);
        expect(await productRepo.count()).toEqual(0);
      });

      describe.each([
        ...TestProductData.getCodeErrorDataList('create'),
        ...TestProductData.getNameErrorDataList('create'),
        ...TestProductData.getModelErrorDataList('create'),
        ...TestProductData.getPriceErrorDataList('create'),
        ...TestProductData.getQuantityInStockErrorDataList(),
        ...TestProductData.getActiveErrorDataList(),
        ...TestProductData.getBrandIdErrorDataList('create'),
      ])(
        '$property',
        ({ data, description, property, ExceptionClass, response }) => {
          it(`should fail when ${property} is ${description}`, async () => {
            const brandData = TestBrandData.dataForRepository;
            const brandDto = plainToInstance(
              CreateBrandRequestDTO,
              brandData[0],
            );
            const productDto = plainToInstance(CreateProductRequestDTO, data);
            await stockService.createBrand(brandDto);
            const fn = () => stockService.createProduct(productDto);
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
        ...TestProductData.getCodeAcceptableValues('create'),
        ...TestProductData.getNameAcceptableValues('create'),
        ...TestProductData.getModelAcceptableValues('create'),
        ...TestProductData.getPriceAcceptableValues('create'),
        ...TestProductData.getQuantityInStockAcceptableValues('create'),
        ...TestProductData.getActiveAcceptableValues(),
        ...TestProductData.getBrandIdAcceptableValues('create'),
      ])('$property', ({ data, property, description }) => {
        it(`should validate when ${property} is ${description}`, async () => {
          const brandData = TestBrandData.dataForRepository;
          const brandDto = plainToInstance(CreateBrandRequestDTO, brandData[0]);
          const productDto = plainToInstance(CreateProductRequestDTO, data);
          const expectedResult = { id: 1, ...data };
          const createdBrand = await stockService.createBrand(productDto);
          const createdProduct = await stockService.createProduct(productDto);

          expectedResult.active = productDto.active;
          testValidateProduct(createdProduct, expectedResult);

          const products = await productRepo.find({
            relations: { brand: true },
          });
          expect(products).toHaveLength(1);
          expectedResult.brand = createdBrand;
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
        const updatedProduct = await stockService.updateProduct(2, dto);

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
        [
          ...TestProductData.getCodeErrorDataList('update'),
          ...TestProductData.getNameErrorDataList('update'),
          ...TestProductData.getModelErrorDataList('update'),
          ...TestProductData.getPriceErrorDataList('update'),
          ...TestProductData.getQuantityInStockErrorDataList(),
          ...TestProductData.getActiveErrorDataList(),
          ...TestProductData.getBrandIdErrorDataList('update'),
        ],
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
            const fn = () => stockService.updateProduct(2, productDto);
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
          ...TestProductData.getCodeAcceptableValues('update'),
          ...TestProductData.getNameAcceptableValues('update'),
          ...TestProductData.getModelAcceptableValues('update'),
          ...TestProductData.getPriceAcceptableValues('update'),
          ...TestProductData.getQuantityInStockAcceptableValues('update'),
          ...TestProductData.getActiveAcceptableValues(),
          ...TestProductData.getBrandIdAcceptableValues('update'),
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

          const productUpdateDTO = plainToInstance(
            UpdateProductRequestDTO,
            data,
          );
          const expectedProductResults = [
            { id: 1, ...productData[0] },
            { id: 2, ...data, active: productUpdateDTO.active },
            { id: 3, ...productData[2], active: false },
          ];
          if (data[property] == null) {
            expectedProductResults[1][property] = productsBefore[1][property];
          }

          expectedProductResults[1].active = productUpdateDTO.active;
          const updatedProduct = await stockService.updateProduct(
            2,
            productUpdateDTO,
          );

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
        const products = await productRepo.find({ relations: { brand: true } });

        const serviceProducts = await stockService.findProducts();
        expect(serviceProducts).toHaveLength(3);
        testValidateProduct(serviceProducts[0], products[0]);
        testValidateProduct(serviceProducts[1], products[1]);
        testValidateProduct(serviceProducts[2], products[2]);
      });

      it('should return empty list', async () => {
        const serviceProducts = await stockService.findProducts();
        expect(serviceProducts).toHaveLength(0);
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

        const serviceProduct = await stockService.findProduct(2);
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

        const fn = () => stockService.findProduct(null);
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

        const fn = () => stockService.findProduct(200);
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

        const retDelete = await stockService.deleteProduct(2);
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

        const fn = () => stockService.deleteProduct(null);
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

        const fn = () => stockService.deleteProduct(200);
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

    describe('search', () => {
      it('should do textual search for products.', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        const brands = await brandRepo.find();
        await productRepo.insert([
          productData[0],
          productData[1],
          productData[2],
        ]);
        const products = await productRepo.find({ relations: { brand: true } });

        const search1 = await stockService.searchProducts('duct 1');
        const search2 = await stockService.searchProducts('Product');

        expect(search1).toHaveLength(1);
        testValidateProduct(search1[0], products[0]);
        expect(search2).toHaveLength(3);
        testValidateProduct(search2[0], products[0]);
        testValidateProduct(search2[1], products[1]);
        testValidateProduct(search2[2], products[2]);
      });

      it('should empty results', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          productData[2],
        ]);
        const products = await productRepo.find({ relations: { brand: true } });

        const search1 = await stockService.searchProducts('must be empty');

        expect(search1).toHaveLength(0);
      });

      it('should fail when parameter is not string', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          productData[2],
        ]);
        const productBefore = await productRepo.find({
          relations: { brand: true },
        });

        const fn = () => stockService.searchBrands(null);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(
          await productRepo.find({ relations: { brand: true } }),
        ).toStrictEqual(productBefore);
        await expect(fn()).rejects.toThrow('Search must be string');
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Unprocessable Entity',
            message: 'Search must be string',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
      });

      it('should fail when parameter is empty string', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert([
          productData[0],
          productData[1],
          productData[2],
        ]);
        const productBefore = await productRepo.find({
          relations: { brand: true },
        });

        const fn = () => stockService.searchProducts('');
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(
          await productRepo.find({ relations: { brand: true } }),
        ).toStrictEqual(productBefore);
        await expect(fn()).rejects.toThrow('Search is empty');
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Unprocessable Entity',
            message: 'Search is empty',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
      });
    });
  });
});
