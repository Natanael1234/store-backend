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
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { NumberMessage } from '../../../../src/modules/system/messages/number/number.messages';
import { TextMessage } from '../../../../src/modules/system/messages/text/text.messages';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
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
const CodeMessage = new TextMessage('code', {
  minLength: ProductConfigs.CODE_MIN_LENGTH,
  maxLength: ProductConfigs.CODE_MAX_LENGTH,
});
const NameMessage = new TextMessage('name', {
  minLength: ProductConfigs.NAME_MIN_LENGTH,
  maxLength: ProductConfigs.NAME_MAX_LENGTH,
});
const ModelMessage = new TextMessage('model', {
  minLength: ProductConfigs.MODEL_MIN_LENGTH,
  maxLength: ProductConfigs.MODEL_MAX_LENGTH,
});
const PriceMessage = new NumberMessage('price', {
  min: ProductConfigs.MIN_PRICE,
  max: ProductConfigs.MAX_PRICE,
});
const QuantityInStockMessage = new NumberMessage('quantity in stock', {
  min: ProductConfigs.MIN_QUANTITY_IN_STOCK,
  max: ProductConfigs.MAX_QUANTITY_IN_STOCK,
});
const ActiveMessage = new BoolMessage('active');
const BrandIdMessage = new UuidMessage('brand id');
const CategoryIdMessage = new UuidMessage('category id');

describe('ProductController (e2e) - patch /products/:productId (main)', () => {
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

  async function insertProducts(
    ...products: TestProductInsertParams[]
  ): Promise<string[]> {
    return testInsertProducts(productRepo, products);
  }

  it('should update product', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    );
    const [categoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
      { name: 'Category 3', active: false, parentPosition: 2 },
    );
    const [productId1, productId2, productId3] = await insertProducts(
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
        quantityInStock: 5,
        active: false,
        brandId: brandId2,
        categoryId: categoryId2,
      },
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
        code: '00000001b',
        name: 'Product 2b',
        model: 'Model 1b',
        price: 500,
        quantityInStock: 600,
        active: true,
        brandId: brandId3,
        categoryId: categoryId3,
        brand: { id: brandId3, name: 'Brand 3', active: false },
        category: { id: categoryId3, name: 'Category 3', active: false },
        images: [],
      },
      {
        id: productId3,
        code: '00000003',
        name: 'Product 3',
        model: 'Model 3',
        price: 20,
        quantityInStock: 5,
        active: false,
        brandId: brandId2,
        categoryId: categoryId2,
        brand: { id: brandId2, name: 'Brand 2', active: false },
        category: { id: categoryId2, name: 'Category 2', active: true },
        images: [],
      },
    ];
    const updatedProduct = await testPatchMin(
      app,
      '/products/' + productId2,
      {
        code: '00000001b',
        name: 'Product 2b',
        model: 'Model 1b',
        price: 500,
        quantityInStock: 600,
        active: true,
        brandId: brandId3,
        categoryId: categoryId3,
      },
      rootToken,
      HttpStatus.OK,
    );
    testValidateProduct(updatedProduct, expectedResults[1]);
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

  it('should reject when whem multiple fields are invalid', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1] = await insertProducts({
      code: '00000001',
      name: 'Product 1',
      model: 'Model 1',
      price: 100,
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
    const response = await testPatchMin(
      app,
      '/products/' + productId1,
      {
        code: 1,
        name: null,
        model: true,
        price: -1,
        quantityInStock: 1.1,
        active: null,
        brandId: 1,
        categoryId: 1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
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
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: {
        code: CodeMessage.INVALID,
        name: NameMessage.NULL,
        model: ModelMessage.INVALID,
        price: PriceMessage.MIN,
        quantityInStock: QuantityInStockMessage.INT,
        active: ActiveMessage.NULL,
        brandId: BrandIdMessage.STRING,
        categoryId: CategoryIdMessage.STRING,
      },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
