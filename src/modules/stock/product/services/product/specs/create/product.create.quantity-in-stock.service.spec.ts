import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { testValidateProducts } from '../../../../../../../test/product/test-product-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { NumberMessage } from '../../../../../../system/messages/number/number.messages';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

const QuantityInStockMessage = new NumberMessage('quantity in stock', {
  min: ProductConfigs.MIN_QUANTITY_IN_STOCK,
  max: ProductConfigs.MAX_QUANTITY_IN_STOCK,
});

describe('ProductService.create (quantityInStock)', () => {
  let productService: ProductService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    productService = module.get<ProductService>(ProductService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  async function insertCategories(
    ...categories: TestCategoryInsertParams[]
  ): Promise<string[]> {
    return testInsertCategories(categoryRepo, categories);
  }

  it(`should accept create category when quantityInStock is minimum allowed`, async () => {
    const quantityInStock = ProductConfigs.MIN_QUANTITY_IN_STOCK;
    const [brandId1, brandId2] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const data = {
      code: '001',
      name: 'Product 1',
      model: 'A1',
      price: 100,
      quantityInStock,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    };
    const expectedResults = [
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
    ];
    const ret = await productService.create(data);
    const expectedResult = expectedResults.find((r) => r.name == 'Product 1');
    expect(expectedResult).toBeDefined();
    const products = await productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGES,
      )
      .getMany();
    testValidateProducts(products, expectedResults);
  });

  it(`should accept create category when quantityInStock is maximum allowed`, async () => {
    const quantityInStock = ProductConfigs.MAX_QUANTITY_IN_STOCK;
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const data = {
      code: '001',
      name: 'Product 1',
      model: 'A1',
      price: 100,
      quantityInStock,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    };
    const expectedResults = [
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
    ];
    const ret = await productService.create(data);
    const expectedResult = expectedResults.find((r) => r.name == 'Product 1');
    expect(expectedResult).toBeDefined();
    const products = await productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGES,
      )
      .getMany();
    testValidateProducts(products, expectedResults);
  });

  it('should reject when quantityInStock is float', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: ProductConfigs.MIN_QUANTITY_IN_STOCK + 0.1,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { quantityInStock: QuantityInStockMessage.INT },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when quantityInStock is null', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: null,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { quantityInStock: QuantityInStockMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when quantityInStock is undefined', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: undefined,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { quantityInStock: QuantityInStockMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when quantityInStock is smaller than allowed', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: ProductConfigs.MIN_QUANTITY_IN_STOCK - 1,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { quantityInStock: QuantityInStockMessage.MIN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when quantityInStock is greater than allowed', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: ProductConfigs.MAX_QUANTITY_IN_STOCK + 1,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { quantityInStock: QuantityInStockMessage.MAX },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when quantityInStock is string', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock:
          `${ProductConfigs.MIN_QUANTITY_IN_STOCK}` as unknown as number,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { quantityInStock: QuantityInStockMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when quantityInStockis boolean', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: true as unknown as number,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { quantityInStock: QuantityInStockMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when quantityInStockis object', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: {} as unknown as number,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { quantityInStock: QuantityInStockMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when quantityInStockis array', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: [] as unknown as number,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });

    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { quantityInStock: QuantityInStockMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
