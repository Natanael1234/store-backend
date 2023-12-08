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
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

const NameMessage = new TextMessage('name', {
  minLength: ProductConfigs.NAME_MIN_LENGTH,
  maxLength: ProductConfigs.NAME_MAX_LENGTH,
});

describe('ProductService.create (name)', () => {
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

  it('should accept when name has min allowed length', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const name = 'x'.repeat(ProductConfigs.NAME_MIN_LENGTH);
    const data = {
      code: '001',
      name: name,
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
        name: name,
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
    const expectedResult = expectedResults.find((r) => r.name == name);
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

  it('should accept when name has max allowed length', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const name = 'x'.repeat(ProductConfigs.NAME_MAX_LENGTH);
    const data = {
      code: '001',
      name: name,
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
        name: name,
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
    const expectedResult = expectedResults.find((r) => r.name == name);
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

  it('should reject when name is shorter than allowed', async () => {
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
        name: 'x'.repeat(ProductConfigs.NAME_MIN_LENGTH - 1),
        model: 'A1',
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
        message: { name: NameMessage.MIN_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is longer than allowed', async () => {
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
        name: 'x'.repeat(ProductConfigs.NAME_MAX_LENGTH + 1),
        model: 'A1',
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
        message: { name: NameMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is null', async () => {
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
        name: null,
        model: 'A1',
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
        message: { name: NameMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is undefined', async () => {
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
        name: undefined,
        model: 'A1',
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
        message: { name: NameMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is number', async () => {
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
        name: 1 as unknown as string,
        model: 'A1',
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
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is boolean', async () => {
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
        name: true as unknown as string,
        model: 'A1',
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
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is array', async () => {
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
        name: [] as unknown as string,
        model: 'A1',
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
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is object', async () => {
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
        name: {} as unknown as string,
        model: 'A1',
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
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
