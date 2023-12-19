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
  testValidateProduct,
  testValidateProducts,
} from '../../../../../../../test/product/test-product-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductImage } from '../../../../../product-image/models/product-image/product-image.entity';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

const ModelMessage = new TextMessage('model', {
  minLength: ProductConfigs.MODEL_MIN_LENGTH,
  maxLength: ProductConfigs.MODEL_MAX_LENGTH,
});

describe('ProductService.create (model)', () => {
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

  function testValidateImage(
    expectedImageData: {
      id: number;
      name?: string;
      description?: string;
      image: string;
      thumbnail?: string;
      main: boolean;
      active?: boolean;
      productId: number;
    },
    image: ProductImage,
  ) {
    expect(image).toBeDefined();
    expect(image.id).toEqual(expectedImageData.id);
    expect(image.name).toEqual(expectedImageData.name);
    expect(image.description).toEqual(expectedImageData.description);
    expect(image.image).toEqual(expectedImageData.image);
    expect(image.thumbnail).toEqual(expectedImageData.thumbnail);
    expect(image.active).toEqual(expectedImageData.active);
    expect(image.main).toEqual(expectedImageData.main);
    expect(image.productId).toEqual(expectedImageData.productId);
  }

  function testValidateImages(
    expectedImageData: {
      id: number;
      name?: string;
      description?: string;
      image: string;
      thumbnail?: string;
      main: boolean;
      active?: boolean;
      productId: number;
    }[],
    images: ProductImage[],
  ) {
    expect(images).toBeDefined();
    expect(images).toHaveLength(expectedImageData.length);
    for (let i = 0; i < images.length; i++) {
      testValidateImage(expectedImageData[i], images[i]);
    }
  }

  function testValidateProductImages(
    product: Product,
    expectedProductData: {
      id: number;
      images?: {
        id: number;
        name?: string;
        description?: string;
        image: string;
        thumbnail?: string;
        main: boolean;
        active?: boolean;
        productId: number;
      }[];
    },
  ) {
    expect(expectedProductData.id).toEqual(product.id);
    if (!expectedProductData.images) {
      expect(product.images).not.toBeDefined();
    } else {
      expect(product.images).toBeDefined();
      expect(product.images).toHaveLength(expectedProductData.images.length);
      for (let i = 0; i < product.images.length; i++) {
        testValidateImage(expectedProductData.images[i], product.images[i]);
      }
    }
  }

  function testValidadeProductsImages(
    products: Product[],
    expectedProductsData: {
      id: number;
      images?: {
        id: number;
        name?: string;
        description?: string;
        image: string;
        thumbnail?: string;
        main: boolean;
        active?: boolean;
        productId: number;
      }[];
    }[],
  ) {
    expect(products).toBeDefined();
    expect(products).toHaveLength(expectedProductsData.length);
    for (let i = 0; i < products.length; i++) {
      testValidateProductImages(products[i], expectedProductsData[i]);
    }
  }

  it('should accept when model has min allowed length', async () => {
    const [brandId1, brandid2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const model = 'x'.repeat(ProductConfigs.MODEL_MIN_LENGTH);
    const data = {
      code: '001',
      name: 'Product 1',
      model: model,
      price: 32.5,
      quantityInStock: 40,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    };
    const expectedResults = [
      {
        code: '001',
        name: 'Product 1',
        model: model,
        price: 32.5,
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
    testValidateProduct(ret, expectedResults[0]);
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

  it('should accept when model has max allowed length', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const model = 'x'.repeat(ProductConfigs.MODEL_MAX_LENGTH);
    const data = {
      code: '001',
      name: 'Product 1',
      model: model,
      price: 32.5,
      quantityInStock: 40,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    };
    const expectedResults = [
      {
        code: '001',
        name: 'Product 1',
        model: model,
        price: 32.5,
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
    testValidateProduct(ret, expectedResults[0]);
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

  it('should reject when model is shorter than allowed', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'x'.repeat(ProductConfigs.MODEL_MIN_LENGTH - 1),
        price: 32.5,
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
        message: { model: ModelMessage.MIN_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when model is longer than allowed', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'x'.repeat(ProductConfigs.MODEL_MAX_LENGTH + 1),
        price: 32.5,
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
        message: { model: ModelMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when model is null', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: null,
        price: 32.5,
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
        message: { model: ModelMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when model is undefined', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: undefined,
        price: 32.5,
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
        message: { model: ModelMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when model is number', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 1 as unknown as string,
        price: 32.5,
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
        message: { model: ModelMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when model is boolean', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: true as unknown as string,
        price: 32.5,
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
        message: { model: ModelMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when model is array', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: [] as unknown as string,
        price: 32.5,
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
        message: { model: ModelMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when model is object', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: {} as unknown as string,
        price: 32.5,
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
        message: { model: ModelMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
