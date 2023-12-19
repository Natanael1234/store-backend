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
import {
  TestProductInsertParams,
  testInsertProducts,
  testValidateProduct,
  testValidateProducts,
} from '../../../../../../../test/product/test-product-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { NumberMessage } from '../../../../../../system/messages/number/number.messages';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductImage } from '../../../../../product-image/models/product-image/product-image.entity';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

const PriceMessage = new NumberMessage('price', {
  min: ProductConfigs.MIN_PRICE,
  max: ProductConfigs.MAX_PRICE,
});

describe('ProductService.update (price)', () => {
  let productService: ProductService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let imageRepo: Repository<ProductImage>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    imageRepo = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
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

  async function insertProducts(
    ...products: TestProductInsertParams[]
  ): Promise<string[]> {
    return testInsertProducts(productRepo, products);
  }

  it(`should accept create when price is minimum allowed`, async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1, productId2] = await insertProducts(
      {
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      {
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
      },
    );
    const price = ProductConfigs.MIN_PRICE;
    const productId = productId2;
    const data = { price };
    const expectedResults = [
      {
        id: productId1,
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
      {
        id: productId2,
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
    ];
    const updatedProduct = await productService.update(productId, data);
    expect(updatedProduct).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.id == productId);
    expect(expectedResult).toBeDefined();
    testValidateProduct(updatedProduct, expectedResult);
    const productsAfter = await productRepo
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
    testValidateProducts(productsAfter, expectedResults);
  });

  it(`should accept create when price is maximum allowed`, async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1, productId2] = await insertProducts(
      {
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      {
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
      },
    );
    const price = ProductConfigs.MAX_PRICE;
    const productId = productId2;
    const data = { price };
    const expectedResults = [
      {
        id: productId1,
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
      {
        id: productId2,
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
    ];
    const updatedProduct = await productService.update(productId, data);
    expect(updatedProduct).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.id == productId);
    expect(expectedResult).toBeDefined();
    testValidateProduct(updatedProduct, expectedResult);
    const productsAfter = await productRepo
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
    testValidateProducts(productsAfter, expectedResults);
  });

  it(`should accept create when price is float`, async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1, productId2] = await insertProducts(
      {
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      {
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
      },
    );
    const price = ProductConfigs.MIN_PRICE + 0.1;
    const productId = productId2;
    const data = { price };
    const expectedResults = [
      {
        id: productId1,
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
      {
        id: productId2,
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
    ];
    const updatedProduct = await productService.update(productId, data);
    expect(updatedProduct).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.id == productId);
    expect(expectedResult).toBeDefined();
    testValidateProduct(updatedProduct, expectedResult);
    const productsAfter = await productRepo
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
    testValidateProducts(productsAfter, expectedResults);
  });

  it(`should accept create when price is undefined`, async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1, productId2] = await insertProducts(
      {
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      {
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
      },
    );
    const price = undefined;
    const productId = productId2;
    const data = { price, active: true };
    const expectedResults = [
      {
        id: productId1,
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
      {
        id: productId2,
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
    ];
    const updatedProduct = await productService.update(productId, data);
    expect(updatedProduct).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.id == productId);
    expect(expectedResult).toBeDefined();
    testValidateProduct(updatedProduct, expectedResult);
    const productsAfter = await productRepo
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
    testValidateProducts(productsAfter, expectedResults);
  });

  it('should reject when price is null', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1] = await insertProducts({
      code: '00000001',
      name: 'Product 1',
      model: 'Model 1',
      price: 50,
      quantityInStock: 5,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    });
    const productsBefore = await productRepo
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
    const productId = productId1;
    const data = { price: null };
    const fn = () => productService.update(productId, data);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const productsAfter = await productRepo
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
    expect(productsBefore).toStrictEqual(productsAfter);
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

  it('should reject when price is smaller than allowed', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1] = await insertProducts({
      code: '00000001',
      name: 'Product 1',
      model: 'Model 1',
      price: 50,
      quantityInStock: 5,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    });
    const productsBefore = await productRepo
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
    const productId = productId1;
    const data = { price: ProductConfigs.MIN_PRICE - 1 };
    const fn = () => productService.update(productId, data);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const productsAfter = await productRepo
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
    expect(productsBefore).toStrictEqual(productsAfter);
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
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1] = await insertProducts({
      code: '00000001',
      name: 'Product 1',
      model: 'Model 1',
      price: 50,
      quantityInStock: 5,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    });
    const productsBefore = await productRepo
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
    const productId = productId1;
    const data = { price: ProductConfigs.MAX_PRICE + 1 };
    const fn = () => productService.update(productId, data);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const productsAfter = await productRepo
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
    expect(productsBefore).toStrictEqual(productsAfter);
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

  it('should reject when price is boolean', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1] = await insertProducts({
      code: '00000001',
      name: 'Product 1',
      model: 'Model 1',
      price: 50,
      quantityInStock: 5,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    });
    const productsBefore = await productRepo
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
    const productId = productId1;
    const data = { price: true as unknown as number };
    const fn = () => productService.update(productId, data);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const productsAfter = await productRepo
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
    expect(productsBefore).toStrictEqual(productsAfter);
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

  it('should reject when price is string', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1] = await insertProducts({
      code: '00000001',
      name: 'Product 1',
      model: 'Model 1',
      price: 50,
      quantityInStock: 5,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    });
    const productsBefore = await productRepo
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
    const productId = productId1;
    const data = { price: '1.99' as unknown as number };
    const fn = () => productService.update(productId, data);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const productsAfter = await productRepo
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
    expect(productsBefore).toStrictEqual(productsAfter);
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
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1] = await insertProducts({
      code: '00000001',
      name: 'Product 1',
      model: 'Model 1',
      price: 50,
      quantityInStock: 5,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    });
    const productsBefore = await productRepo
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
    const productId = productId1;
    const data = { price: [] as unknown as number };
    const fn = () => productService.update(productId, data);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const productsAfter = await productRepo
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
    expect(productsBefore).toStrictEqual(productsAfter);
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
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1] = await insertProducts({
      code: '00000001',
      name: 'Product 1',
      model: 'Model 1',
      price: 50,
      quantityInStock: 5,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    });
    const productsBefore = await productRepo
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
    const productId = productId1;
    const data = { price: {} as unknown as number };
    const fn = () => productService.update(productId, data);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const productsAfter = await productRepo
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
    expect(productsBefore).toStrictEqual(productsAfter);
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
