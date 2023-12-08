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

const PriceMessage = new NumberMessage('price', {
  min: ProductConfigs.MIN_PRICE,
  max: ProductConfigs.MAX_PRICE,
});

describe('ProductService.create (price)', () => {
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

  it(`should accept create when price is minimum allowed`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const price = ProductConfigs.MIN_PRICE;
    const data = {
      code: '001',
      name: 'Product 1',
      model: 'A1',
      price,
      quantityInStock: 40,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    };
    const expectedResults = [
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price,
        quantityInStock: 40,
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

  it(`should accept create when price is maximum allowed`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const price = ProductConfigs.MAX_PRICE;
    const data = {
      code: '001',
      name: 'Product 1',
      model: 'A1',
      price,
      quantityInStock: 40,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    };
    const expectedResults = [
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price,
        quantityInStock: 40,
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

  it(`should accept create when price is float`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const price = ProductConfigs.MIN_PRICE + 0.1;
    const data = {
      code: '001',
      name: 'Product 1',
      model: 'A1',
      price: price,
      quantityInStock: 40,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    };
    const expectedResults = [
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: price,
        quantityInStock: 40,
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

  it('should reject when price is null', async () => {
    const [brandId1, brandId2] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: null,
        quantityInStock: 40,
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
        message: { price: PriceMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when price is undefined', async () => {
    const [brandId1, brandId2] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: undefined,
        quantityInStock: 40,
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
        message: { price: PriceMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when price is smaller than allowed', async () => {
    const [brandId1, brandId2] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: ProductConfigs.MIN_PRICE - 1,
        quantityInStock: 40,
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
        message: { price: PriceMessage.MIN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when price is greater than allowed', async () => {
    const [brandId1, brandId2] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: ProductConfigs.MAX_PRICE + 1,
        quantityInStock: 40,
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
        message: { price: PriceMessage.MAX },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when price is string', async () => {
    const [brandId1, brandId2] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: `${ProductConfigs.MIN_PRICE}` as unknown as number,
        quantityInStock: 40,
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
        message: { price: PriceMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when price is boolean', async () => {
    const [brandId1, brandId2] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: true as unknown as number,
        quantityInStock: 40,
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
        message: { price: PriceMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when price is array', async () => {
    const [brandId1, brandId2] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: [] as unknown as number,
        quantityInStock: 40,
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
        message: { price: PriceMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when price is object', async () => {
    const [brandId1, brandId2] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1, categoryId2] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: {} as unknown as number,
        quantityInStock: 40,
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
        message: { price: PriceMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
