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

const QuantityInStockMessage = new NumberMessage('quantity in stock', {
  min: ProductConfigs.MIN_QUANTITY_IN_STOCK,
  max: ProductConfigs.MAX_QUANTITY_IN_STOCK,
});

describe('ProductController (e2e) - post /products (quantityInStock)', () => {
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

  it('should reject when quantityInStock is float', async () => {
    const [brandId1] = await insertBrands({
      name: 'Brand 1',
      active: true,
    });
    const [categoryId1] = await insertCategories({
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
        price: 100,
        quantityInStock: ProductConfigs.MIN_QUANTITY_IN_STOCK + 0.1,
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
      message: { quantityInStock: QuantityInStockMessage.INT },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: null,
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
      message: { quantityInStock: QuantityInStockMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: undefined,
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
      message: { quantityInStock: QuantityInStockMessage.REQUIRED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: ProductConfigs.MIN_QUANTITY_IN_STOCK - 1,
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
      message: { quantityInStock: QuantityInStockMessage.MIN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: ProductConfigs.MAX_QUANTITY_IN_STOCK + 1,
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
      message: { quantityInStock: QuantityInStockMessage.MAX },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: `${ProductConfigs.MIN_QUANTITY_IN_STOCK}`,
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
      message: { quantityInStock: QuantityInStockMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: true,
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
      message: { quantityInStock: QuantityInStockMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: {},
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
      message: { quantityInStock: QuantityInStockMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testPostMin(
      app,
      '/products',
      {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 100,
        quantityInStock: [],
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
      message: { quantityInStock: QuantityInStockMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
