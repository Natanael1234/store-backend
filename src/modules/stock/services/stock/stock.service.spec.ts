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
import { testValidateBrand } from '../../../../test/test-brand-utils';
import { TestProductData } from '../../../../test/test-product-data';
import { testValidateProduct } from '../../../../test/test-product-utils';
import { CreateBrandRequestDTO } from '../../dtos/request/create-brand/create-brand.request.dto';
import { CreateProductRequestDTO } from '../../dtos/request/create-product/create-product.request.dto';
import { UpdateBrandRequestDTO } from '../../dtos/request/update-brand/update-brand.request.dto';
import { UpdateProductRequestDTO } from '../../dtos/request/update-product/update-product.request.dto';
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

  describe('brand', () => {
    describe('create', () => {
      it('should create brand', async () => {
        const brandData = TestBrandData.dataForRepository;

        const creatBrandDtos = [
          plainToInstance(CreateBrandRequestDTO, brandData[0]),
          plainToInstance(CreateBrandRequestDTO, brandData[1]),
          plainToInstance(CreateBrandRequestDTO, brandData[2]),
        ];

        const expectedResults = [
          { id: 1, ...brandData[0] },
          { id: 2, ...brandData[1] },
          { id: 3, ...brandData[2], active: false },
        ];

        const createdBrands = [
          await stockService.createBrand(creatBrandDtos[0]),
          await stockService.createBrand(creatBrandDtos[1]),
          await stockService.createBrand(creatBrandDtos[2]),
        ];

        testValidateBrand(createdBrands[0], expectedResults[0]);
        testValidateBrand(createdBrands[1], expectedResults[1]);
        testValidateBrand(createdBrands[2], expectedResults[2]);

        const brands = await brandRepo.find();
        expect(brands).toHaveLength(3);
        testValidateBrand(brands[0], expectedResults[0]);
        testValidateBrand(brands[1], expectedResults[1]);
        testValidateBrand(brands[2], expectedResults[2]);
      });

      const createBrandErrorTest = async ({
        data,
        ExceptionClass,
        response,
      }) => {
        const brandDto = plainToInstance(CreateBrandRequestDTO, data);
        const fn = () => stockService.createBrand(brandDto);
        await expect(fn()).rejects.toThrow(ExceptionClass);
        expect(await brandRepo.count()).toEqual(0);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual(response);
        }
      };

      const createBrandAcceptTest = async ({ property, data, description }) => {
        const brandDto = plainToInstance(CreateBrandRequestDTO, data);
        const expectedResult = { id: 1, ...data, active: brandDto.active };
        const createdBrand = await stockService.createBrand(brandDto);
        // expectedResult.active = brandDto.active;

        testValidateBrand(createdBrand, expectedResult);
        const brands = await brandRepo.find();
        expect(brands).toHaveLength(1);
        expectedResult.brand = createdBrand;
        testValidateBrand(brands[0], expectedResult);
      };

      describe('name', () => {
        it.each(TestBrandData.getNameErrorDataList('create'))(
          'should fail when name is $description',
          createBrandErrorTest,
        );

        it.each(TestBrandData.getNameAcceptableValues('create'))(
          'should validate when name is $description',
          createBrandAcceptTest,
        );
      });

      describe('active', () => {
        it.each(TestBrandData.getActiveErrorDataList())(
          'should fail when active is $description',
          createBrandErrorTest,
        );

        it.each(TestBrandData.getActiveAcceptableValues())(
          'should validate when active is $description',
          createBrandAcceptTest,
        );
      });
    });

    describe('update', () => {
      it('should update brand', async () => {
        const brandData = TestBrandData.dataForRepository;

        const createdBrands = [
          await brandRepo.insert(brandData[0]),
          await brandRepo.insert(brandData[1]),
          await brandRepo.insert(brandData[2]),
        ];
        const brandsBefore = await brandRepo.find();

        const updateData = { name: 'New Name', active: true };
        const brandDto = plainToInstance(UpdateBrandRequestDTO, updateData);
        const expectedResults = [
          { ...brandsBefore[0] },
          { id: 2, name: updateData.name, active: updateData.active },
          { ...brandsBefore[2] },
        ];

        const updatedBrand = await stockService.updateBrand(2, brandDto);

        testValidateBrand(updatedBrand, expectedResults[1]);

        const brandsAfter = await brandRepo.find();
        expect(brandsAfter).toHaveLength(3);
        testValidateBrand(brandsAfter[0], expectedResults[0]);
        testValidateBrand(brandsAfter[1], expectedResults[1]);
        testValidateBrand(brandsAfter[2], expectedResults[2]);
      });

      const updateBrandErrorTest = async ({
        description,
        data,
        ExceptionClass,
        response,
      }) => {
        const brandData = TestBrandData.dataForRepository;

        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);

        const brandDto = plainToInstance(UpdateBrandRequestDTO, data);

        const brandsBefore = await brandRepo.find();
        const fn = () => stockService.updateBrand(2, brandDto);
        await expect(fn()).rejects.toThrow(ExceptionClass);
        const brandsAfter = await brandRepo.find();
        expect(brandsBefore).toStrictEqual(brandsAfter);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual(response);
        }
      };

      const updateBrandAcceptTest = async ({ description, property, data }) => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const brandsBefore = await brandRepo.find();
        const expectedBrandResults = [
          { id: 1, ...brandData[0] },
          { id: 2, ...data },
          { id: 3, ...brandData[2] },
        ];
        const brandUpdateDTO = plainToInstance(UpdateBrandRequestDTO, data);
        if (data[property] == null) {
          expectedBrandResults[1][property] = brandsBefore[1][property];
        }
        expectedBrandResults[1].active = brandUpdateDTO.active;

        const updatedBrand = await stockService.updateBrand(2, brandUpdateDTO);

        testValidateBrand(updatedBrand, expectedBrandResults[1]);

        const brandsAfter = await brandRepo.find();
        expect(brandsBefore).toHaveLength(3);
        testValidateBrand(brandsAfter[0], expectedBrandResults[0]);
        testValidateBrand(brandsAfter[1], expectedBrandResults[1]);
        testValidateBrand(brandsAfter[2], expectedBrandResults[2]);
      };

      describe('name', () => {
        it.each(TestBrandData.getNameErrorDataList('update'))(
          'should fail when name is $description',
          updateBrandErrorTest,
        );

        it.each(TestBrandData.getNameAcceptableValues('update'))(
          'should validate when name is $description',
          updateBrandAcceptTest,
        );
      });

      describe('active', () => {
        it.each(TestBrandData.getActiveErrorDataList())(
          'should fail when active is $description',
          updateBrandErrorTest,
        );

        it.each(TestBrandData.getActiveAcceptableValues())(
          'should validate when active is $description',
          updateBrandAcceptTest,
        );
      });
    });

    describe('find', () => {
      it('should find brands', async () => {
        const brandData = TestBrandData.dataForRepository;

        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);

        const brandsBefore = await brandRepo.find();
        const serviceBrands = await stockService.findBrands();
        const brandsAfter = await brandRepo.find();

        expect(brandsAfter).toStrictEqual(brandsBefore);
        testValidateBrand(serviceBrands[0], brandsBefore[0]);
        testValidateBrand(serviceBrands[1], brandsBefore[1]);
        testValidateBrand(serviceBrands[2], brandsBefore[2]);
      });

      it('should return empty list', async () => {
        const brandsBefore = await brandRepo.find();
        const serviceBrands = await stockService.findBrands();
        const brandsAfter = await brandRepo.find();

        expect(brandsBefore).toHaveLength(0);
        expect(serviceBrands).toHaveLength(0);
        expect(brandsAfter).toHaveLength(0);
      });
    });

    describe('findForId', () => {
      it('should find brand for id', async () => {
        const brandData = TestBrandData.dataForRepository;

        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);

        const brandsBefore = await brandRepo.find();
        const serviceBrand = await stockService.findBrand(2);
        const brandsAfter = await brandRepo.find();

        expect(brandsAfter).toStrictEqual(brandsBefore);
        testValidateBrand(serviceBrand, brandsBefore[1]);
        const allBrandsAfter = await brandRepo.find();
      });

      it('should fail when brandId is not defined', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const brandsBefore = await brandRepo.find();

        const fn = () => stockService.findBrand(null);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(await brandRepo.find()).toStrictEqual(brandsBefore);
        await expect(fn()).rejects.toThrow(BrandMessage.ID_REQUIRED);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Unprocessable Entity',
            message: BrandMessage.ID_REQUIRED,
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
      });

      it('should fail when brand does not exists', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const brandsBefore = await brandRepo.find();

        const fn = () => stockService.findBrand(200);
        await expect(fn()).rejects.toThrow(NotFoundException);
        expect(await brandRepo.find()).toStrictEqual(brandsBefore);
        await expect(fn()).rejects.toThrow(BrandMessage.NOT_FOUND);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Not Found',
            message: BrandMessage.NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
          });
        }
      });
    });

    describe('delete', () => {
      it('should update brand', async () => {
        const brandData = TestBrandData.dataForRepository;

        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);

        const brandsBefore = await brandRepo.find();
        const serviceBrand = await stockService.deleteBrand(2);
        const brandsAfter = await brandRepo.find();

        expect(brandsAfter).toStrictEqual([brandsBefore[0], brandsBefore[2]]);
        const allBrandsAfter = await brandRepo.find({ withDeleted: true });
        expect(allBrandsAfter.map((brand) => brand.id)).toEqual([1, 2, 3]);
      });

      it('should fail when brandId is not defined', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const brandsBefore = await brandRepo.find();

        const fn = () => stockService.deleteBrand(null);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(await brandRepo.find()).toStrictEqual(brandsBefore);
        await expect(fn()).rejects.toThrow(BrandMessage.ID_REQUIRED);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Unprocessable Entity',
            message: BrandMessage.ID_REQUIRED,
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
      });

      it('should fail when brand does not exists', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const brandsBefore = await brandRepo.find();

        const fn = () => stockService.deleteBrand(200);
        await expect(fn()).rejects.toThrow(NotFoundException);
        expect(await brandRepo.find()).toStrictEqual(brandsBefore);
        await expect(fn()).rejects.toThrow(BrandMessage.NOT_FOUND);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'Not Found',
            message: BrandMessage.NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
          });
        }
      });
    });

    describe('search', () => {
      it('should textual search brands', async () => {
        const brandData = TestBrandData.dataForRepository;

        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);

        const brandsBefore = await brandRepo.find();
        const search1 = await stockService.searchBrands('rand 1');
        const brandsAfter = await brandRepo.find();
        const search2 = await stockService.searchBrands('Brand');

        expect(brandsBefore).toStrictEqual(brandsAfter);
        expect(search1).toStrictEqual([brandsBefore[0]]);
        expect(search2).toStrictEqual(brandsBefore);
      });

      it('should textual search brands with empty results', async () => {
        const brandData = TestBrandData.dataForRepository;

        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);

        const brandsBefore = await brandRepo.find();
        const search = await stockService.searchBrands('not found text');
        const brandsAfter = await brandRepo.find();

        expect(brandsBefore).toStrictEqual(brandsAfter);
        expect(search).toHaveLength(0);
      });

      it('should fail when parameter is not string', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const brandsBefore = await brandRepo.find();

        const fn = () => stockService.searchBrands(null);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(await brandRepo.find()).toStrictEqual(brandsBefore);
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
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const brandsBefore = await brandRepo.find();

        const fn = () => stockService.searchBrands('');
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(await brandRepo.find()).toStrictEqual(brandsBefore);
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

  describe('product', () => {
    describe('create product', () => {
      it('should create product', async () => {
        const brandData = TestBrandData.dataForRepository;
        const productData = TestProductData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
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

      const createProductErrorTest = async ({
        data,
        ExceptionClass,
        response,
      }) => {
        const brandData = TestBrandData.dataForRepository;
        const brandDto = plainToInstance(CreateBrandRequestDTO, brandData[0]);
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
      };

      const createProductAcceptTest = async ({ data }) => {
        const brandData = TestBrandData.dataForRepository;
        const brandDto = plainToInstance(CreateBrandRequestDTO, brandData[0]);
        const productDto = plainToInstance(CreateProductRequestDTO, data);
        const expectedResult = { id: 1, ...data };
        const createdBrand = await stockService.createBrand(productDto);
        const createdProduct = await stockService.createProduct(productDto);

        expectedResult.active = productDto.active;
        testValidateProduct(createdProduct, expectedResult);

        const products = await productRepo.find({ relations: { brand: true } });
        expect(products).toHaveLength(1);
        expectedResult.brand = createdBrand;
        testValidateProduct(products[0], expectedResult);
      };

      describe('code', () => {
        it.each(TestProductData.getCodeErrorDataList('create'))(
          'should fail when code is $description',
          createProductErrorTest,
        );

        it.each(TestProductData.getCodeAcceptableValues('create'))(
          'should validate when code is $description',
          createProductAcceptTest,
        );
      });

      describe('name', () => {
        it.each(TestProductData.getNameErrorDataList('create'))(
          'should fail when name is $description',
          createProductErrorTest,
        );

        it.each(TestProductData.getNameAcceptableValues('create'))(
          'should validate when name is $description',
          createProductAcceptTest,
        );
      });

      describe('model', () => {
        it.each(TestProductData.getModelErrorDataList('create'))(
          'should fail when model is $description',
          createProductErrorTest,
        );

        it.each(TestProductData.getModelAcceptableValues('create'))(
          'should validate when model is $description',
          createProductAcceptTest,
        );
      });

      describe('price', () => {
        it.each(TestProductData.getPriceErrorDataList('create'))(
          'should fail when price is $description',
          createProductErrorTest,
        );

        it.each(TestProductData.getPriceAcceptableValues('create'))(
          'should validate when price is $description',
          createProductAcceptTest,
        );
      });

      describe('quantityInStock', () => {
        it.each(TestProductData.getQuantityInStockErrorDataList())(
          'should fail when quantityInStock is $description',
          createProductErrorTest,
        );

        it.each(TestProductData.getQuantityInStockAcceptableValues('create'))(
          'should validate when quantityInStock is $description',
          createProductAcceptTest,
        );
      });

      describe('active', () => {
        it.each(TestProductData.getActiveErrorDataList())(
          'should fail when active is $description',
          createProductErrorTest,
        );

        it.each(TestProductData.getActiveAcceptableValues())(
          'should validate when active is $description',
          createProductAcceptTest,
        );
      });

      describe('brandId', () => {
        it.each(TestProductData.getBrandIdErrorDataList('create'))(
          'should fail when brandId is $description',
          createProductErrorTest,
        );

        it.each(TestProductData.getBrandIdAcceptableValues('create'))(
          'should validate when brandId is $description',
          createProductAcceptTest,
        );
      });
    });

    describe('update product', () => {
      it('should update product', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);

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

      const updateProductErrorTest = async ({
        data,
        ExceptionClass,
        response,
      }) => {
        const brandData = TestBrandData.dataForRepository;
        const productData = TestProductData.dataForRepository;

        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);

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
      };

      const updateProductAcceptTest = async ({ property, data }) => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
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
      };

      describe('code', () => {
        it.each(TestProductData.getCodeErrorDataList('update'))(
          'should fail when code is $description',
          updateProductErrorTest,
        );

        it.each(TestProductData.getCodeAcceptableValues('update'))(
          'should validate when code is $description',
          updateProductAcceptTest,
        );
      });

      describe('name', () => {
        it.each(TestProductData.getNameErrorDataList('update'))(
          'should fail when name is $description',
          updateProductErrorTest,
        );

        it.each(TestProductData.getNameAcceptableValues('update'))(
          'should validate when name is $description',
          updateProductAcceptTest,
        );
      });

      describe('model', () => {
        it.each(TestProductData.getModelErrorDataList('update'))(
          'should fail when model is $description',
          updateProductErrorTest,
        );

        it.each(TestProductData.getModelAcceptableValues('update'))(
          'should validate when model is $description',
          updateProductAcceptTest,
        );
      });

      describe('price', () => {
        it.each(TestProductData.getPriceErrorDataList('update'))(
          'should fail when price is $description',
          updateProductErrorTest,
        );

        it.each(TestProductData.getPriceAcceptableValues('update'))(
          'should validate when price is $description',
          updateProductAcceptTest,
        );
      });

      describe('quantityInStock', () => {
        it.each(TestProductData.getQuantityInStockErrorDataList())(
          'should fail when quantityInStock is $description',
          updateProductErrorTest,
        );

        it.each(TestProductData.getQuantityInStockAcceptableValues('update'))(
          'should validate when quantityInStock is $description',
          updateProductAcceptTest,
        );
      });

      describe('active', () => {
        it.each(TestProductData.getActiveErrorDataList())(
          'should fail when active is $description',
          updateProductErrorTest,
        );

        it.each(TestProductData.getActiveAcceptableValues())(
          'should validate when active is $description',
          updateProductAcceptTest,
        );
      });

      describe('brandId', () => {
        it.each(TestProductData.getBrandIdErrorDataList('update'))(
          'should fail when brandId is $description',
          updateProductErrorTest,
        );

        it.each(TestProductData.getBrandIdAcceptableValues('update'))(
          'should validate when brandId is $description',
          updateProductAcceptTest,
        );
      });
    });

    describe('find', () => {
      it('should find products', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        const brands = await brandRepo.find();
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
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
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        const brands = await brandRepo.find();
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
        const product = await productRepo.findOne({ where: { id: 2 } });

        const serviceProduct = await stockService.findProduct(2);
        expect(serviceProduct).toBeDefined();
        testValidateProduct(serviceProduct, product);
      });

      it('should fail when productId is not defined', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
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
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
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
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
        const productsBefore = await productRepo.find();

        const retDelete = await stockService.deleteProduct(2);
        expect(retDelete).toEqual(true);

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
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
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
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
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
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        const brands = await brandRepo.find();
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
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
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
        const products = await productRepo.find({ relations: { brand: true } });

        const search1 = await stockService.searchProducts('must be empty');

        expect(search1).toHaveLength(0);
      });

      it('should fail when parameter is not string', async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);
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
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
        const productData = TestProductData.dataForRepository;
        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);

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

  describe('bulk create', () => {
    it.skip('should bulk create products and brands', async () => {});
  });
});
