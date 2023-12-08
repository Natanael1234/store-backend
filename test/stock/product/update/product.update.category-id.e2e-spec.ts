import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../src/test/category/test-category-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
  testValidateProduct,
  testValidateProducts,
} from '../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../../utils/test-end-to-end.utils';

const CategoryIdMessage = new UuidMessage('category id');

describe('ProductController (e2e) - patch /products/:productId (categoryId)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;

  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
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
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .getMany();
  }

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

  it(`should accept update when categoryId is valid`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
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
        brandId: brandId2,
        categoryId: categoryId2,
      },
    );

    const response = await testPatchMin(
      app,
      '/products/' + productId2,
      { categoryId: categoryId1 },
      rootToken,
      HttpStatus.OK,
    );
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
        active: false,
        brandId: brandId2,
        categoryId: categoryId1,
        brand: { id: brandId2, name: 'Brand 2', active: false },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
    ];
    testValidateProduct(response, expectedResults[1]);
    const productsAfter = await getProducts();
    testValidateProducts(productsAfter, expectedResults);
  });

  it(`should accept update when categoryId is undefined`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
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
        categoryId: categoryId2,
      },
    );
    const productId = productId2;
    const categoryId = undefined; //  TODO: mover para enum
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
        active: false,
        brandId: brandId1,
        categoryId: categoryId2,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId2, name: 'Category 2', active: true },
        images: [],
      },
    ];
    const response = await testPatchMin(
      app,
      '/products/' + productId,
      { categoryId },
      rootToken,
      HttpStatus.OK,
    );
    testValidateProduct(response, expectedResults[1]);
    const productsAfter = await getProducts();
    testValidateProducts(productsAfter, expectedResults);
  });

  it(`should reject update when categoryId is null`, async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
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
        categoryId: categoryId2,
      },
    );
    const productsBefore = await getProducts();
    const response = await testPatchMin(
      app,
      '/products/' + productId2,
      { categoryId: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const productsAfter = await getProducts();
    expect(productsBefore).toStrictEqual(productsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryId: CategoryIdMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when categoryId is number', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
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
        categoryId: categoryId2,
      },
    );
    const productsBefore = await getProducts();
    const response = await testPatchMin(
      app,
      '/products/' + productId1,
      { categoryId: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const productsAfter = await getProducts();
    expect(productsBefore).toStrictEqual(productsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryId: CategoryIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when categoryId is boolean', async () => {
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
    const productsBefore = await getProducts();
    const response = await testPatchMin(
      app,
      '/products/' + productId1,
      { categoryId: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const productsAfter = await getProducts();
    expect(productsBefore).toStrictEqual(productsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryId: CategoryIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when categoryId is invalid string', async () => {
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
    const productsBefore = await getProducts();
    const response = await testPatchMin(
      app,
      '/products/' + productId1,
      { categoryId: 'not-a-valid-uuid' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const productsAfter = await getProducts();
    expect(productsBefore).toStrictEqual(productsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryId: CategoryIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when categoryId is array', async () => {
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
    const productsBefore = await getProducts();
    const response = await testPatchMin(
      app,
      '/products/' + productId1,
      { categoryId: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const productsAfter = await getProducts();
    expect(productsBefore).toStrictEqual(productsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryId: CategoryIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when categoryId is object', async () => {
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
    const productsBefore = await getProducts();
    const response = await testPatchMin(
      app,
      '/products/' + productId1,
      { categoryId: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const productsAfter = await getProducts();
    expect(productsBefore).toStrictEqual(productsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryId: CategoryIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject update when brand is not found', async () => {
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
    const productsBefore = await getProducts();
    const response = await testPatchMin(
      app,
      '/products/' + productId1,
      { categoryId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38' },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    const productsAfter = await getProducts();
    expect(productsBefore).toStrictEqual(productsAfter);
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: CategoryMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });
});
