import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductConfigs } from '../../../../src/modules/stock/product/configs/product/product.configs';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { NumberMessage } from '../../../../src/modules/system/messages/number/number.messages';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../src/test/category/test-category-utils';
import {
  testValidateProduct,
  testValidateProducts,
} from '../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

const PriceMessage = new NumberMessage('price', {
  min: ProductConfigs.MIN_PRICE,
  max: ProductConfigs.MAX_PRICE,
});

describe('ProductController (e2e) - post /products (price)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;

  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    brandRepo = moduleFixture.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = moduleFixture.get<CategoryRepository>(CategoryRepository);
    productRepo = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
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
    const ret = await testPostMin(
      app,
      '/products',
      data,
      rootToken,
      HttpStatus.CREATED,
    );
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
    const ret = await testPostMin(
      app,
      '/products',
      data,
      rootToken,
      HttpStatus.CREATED,
    );
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
    const ret = await testPostMin(
      app,
      '/products',
      data,
      rootToken,
      HttpStatus.CREATED,
    );
    expect(expectedResults[0]).toBeDefined();
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: null,
        quantityInStock: 40,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await productRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { price: PriceMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: undefined,
        quantityInStock: 40,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await productRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { price: PriceMessage.REQUIRED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: ProductConfigs.MIN_PRICE - 1,
        quantityInStock: 40,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await productRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { price: PriceMessage.MIN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: ProductConfigs.MAX_PRICE + 1,
        quantityInStock: 40,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await productRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { price: PriceMessage.MAX },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: `${ProductConfigs.MIN_PRICE}`,
        quantityInStock: 40,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await productRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { price: PriceMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: true,
        quantityInStock: 40,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await productRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { price: PriceMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: [],
        quantityInStock: 40,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await productRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { price: PriceMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: {},
        quantityInStock: 40,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await productRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { price: PriceMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
