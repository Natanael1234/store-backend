import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
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
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductImage } from '../../../../../product-image/models/product-image/product-image.entity';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { ProductMessage } from '../../../../messages/product/product.messages.enum';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

describe('ProductService.update (productId)', () => {
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

  it(`should accept when minimum productId`, async () => {
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
    const productId = productId1;
    const data = { name: 'New Name' };
    const expectedResults = [
      {
        id: productId1,
        code: '00000001',
        name: 'New Name',
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

  it(`should reject when productId is null`, async () => {
    const fn = () => productService.update(null, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(ProductMessage.REQUIRED_PRODUCT_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when productId is undefined`, async () => {
    const fn = () => productService.update(undefined, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(ProductMessage.REQUIRED_PRODUCT_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when productId is number`, async () => {
    const fn = () =>
      productService.update(1 as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(ProductMessage.INVALID_PRODUCT_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when productId is boolean`, async () => {
    const fn = () =>
      productService.update(true as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(ProductMessage.INVALID_PRODUCT_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when productId is invalid string`, async () => {
    const fn = () =>
      productService.update('not-a-valid-uuid' as unknown as string, {
        name: 'New Name',
      });
    await expect(fn()).rejects.toThrow(ProductMessage.INVALID_PRODUCT_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when productId is array`, async () => {
    const fn = () =>
      productService.update([] as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(ProductMessage.INVALID_PRODUCT_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when productId is object`, async () => {
    const fn = () =>
      productService.update({} as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(ProductMessage.INVALID_PRODUCT_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when productId is not found`, async () => {
    const fn = () =>
      productService.update(
        'f136f640-90b7-11ed-a2a0-fd911f8f7f38' as unknown as string,
        { name: 'New Name' },
      );
    await expect(fn()).rejects.toThrow(ProductMessage.NOT_FOUND);
    await expect(fn()).rejects.toThrow(NotFoundException);
  });
});
