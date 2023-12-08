import {
  HttpStatus,
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
import { testValidateProducts } from '../../../../../../../test/product/test-product-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { BrandMessage } from '../../../../../brand/messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

const BrandIdMessage = new UuidMessage('brand id');

describe('ProductService.create (brandId)', () => {
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

  it(`should accept create when brandId is valid`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const data = {
      code: '001',
      name: 'Product 1',
      model: 'A1',
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
        model: 'A1',
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

  it('should reject when brandId is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 32.5,
        quantityInStock: 40,
        active: true,
        brandId: null,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { brandId: BrandIdMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 32.5,
        quantityInStock: 40,
        active: true,
        brandId: undefined,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { brandId: BrandIdMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is invalid string', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 32.5,
        quantityInStock: 40,
        active: true,
        brandId: 'not-a-valid-uuid',
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { brandId: BrandIdMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is number', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 32.5,
        quantityInStock: 40,
        active: true,
        brandId: 1 as unknown as string,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { brandId: BrandIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is boolean', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 32.5,
        quantityInStock: 40,
        active: true,
        brandId: true as unknown as string,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { brandId: BrandIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 32.5,
        quantityInStock: 40,
        active: true,
        brandId: {} as unknown as string,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { brandId: BrandIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 32.5,
        quantityInStock: 40,
        active: true,
        brandId: [] as unknown as string,
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { brandId: BrandIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brand is not found', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const fn = () =>
      productService.create({
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 32.5,
        quantityInStock: 40,
        active: true,
        brandId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
        categoryId: categoryId1,
      });
    await expect(fn()).rejects.toThrow(NotFoundException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: BrandMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
  });
});
