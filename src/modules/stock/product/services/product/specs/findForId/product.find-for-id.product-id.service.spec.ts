import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testInsertBrands } from '../../../../../../../test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../../../../test/category/test-category-utils';
import { testInsertProducts } from '../../../../../../../test/product/test-product-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductImage } from '../../../../../product-image/models/product-image/product-image.entity';
import { ProductImageService } from '../../../../../product-image/services/product-image/product-image.service';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { ProductMessage } from '../../../../messages/product/product.messages.enum';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

const ProductIdMessage = new UuidMessage('product id');

describe('ProductService.findForId (productId)', () => {
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;
  let productService: ProductService;
  let productImageService: ProductImageService;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    productImageRepo = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
    productService = module.get<ProductService>(ProductService);
    productImageService = module.get<ProductImageService>(ProductImageService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function getProducts() {
    return productRepo
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
      .withDeleted()
      .orderBy(ProductConstants.PRODUCT_NAME)
      .getMany();
  }

  async function createTestScenario() {
    const [brandId1, brandId2, brandId3] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    ]);
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await testInsertCategories(categoryRepo, [
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
        { name: 'Category 4', parentPosition: 1 },
      ]);
    const [productId1, productId2, productId3] = await testInsertProducts(
      productRepo,
      [
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
        {
          code: '00000003',
          name: 'Product 3',
          model: 'Model 3',
          price: 20,
          brandId: brandId2,
          categoryId: categoryId2,
        },
      ],
    );

    return [productId1, productId2, productId3];
  }

  it('should find product', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId2);
    expect(response).toBeDefined();
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[1]);
  });

  it('should reject when productId is null', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const fn = () => productService.findById(null);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await getProducts()).toStrictEqual(productsBefore);
    await expect(fn()).rejects.toThrow(ProductIdMessage.REQUIRED);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ProductIdMessage.REQUIRED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when productId is undefined', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const fn = () => productService.findById(null);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await getProducts()).toStrictEqual(productsBefore);
    await expect(fn()).rejects.toThrow(ProductIdMessage.REQUIRED);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ProductIdMessage.REQUIRED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when productId is number', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const fn = () => productService.findById(1 as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await getProducts()).toStrictEqual(productsBefore);
    await expect(fn()).rejects.toThrow(ProductIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ProductIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when productId is boolean', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const fn = () => productService.findById(true as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await getProducts()).toStrictEqual(productsBefore);
    await expect(fn()).rejects.toThrow(ProductIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ProductIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when productId is invalid string', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const fn = () => productService.findById('not-a-valid-uuid');
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await getProducts()).toStrictEqual(productsBefore);
    await expect(fn()).rejects.toThrow(ProductIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ProductIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when productId is array', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const fn = () => productService.findById([] as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await getProducts()).toStrictEqual(productsBefore);
    await expect(fn()).rejects.toThrow(ProductIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ProductIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when productId is object', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const fn = () => productService.findById({} as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await getProducts()).toStrictEqual(productsBefore);
    await expect(fn()).rejects.toThrow(ProductIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ProductIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when product does not exists', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const fn = () =>
      productService.findById('f136f640-90b7-11ed-a2a0-fd911f8f7f38');
    await expect(fn()).rejects.toThrow(NotFoundException);
    expect(await getProducts()).toStrictEqual(productsBefore);
    await expect(fn()).rejects.toThrow(ProductMessage.NOT_FOUND);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: ProductMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
  });
});
