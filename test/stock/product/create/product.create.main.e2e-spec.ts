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
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
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
import { testValidateProducts } from '../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
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

describe('ProductController (e2e) - post /products (main)', () => {
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

  it('should create product', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    );
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
        { name: 'Category 4', parentPosition: 1 },
      );
    const expectedProducts = [
      {
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 51.45,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
      {
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100.4,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
      {
        code: '00000003',
        name: 'Product 3',
        model: 'Model 3',
        price: 20,
        quantityInStock: 0,
        active: false,
        brandId: brandId2,
        categoryId: categoryId2,
        brand: { id: brandId2, name: 'Brand 2', active: false },
        category: { id: categoryId2, name: 'Category 2', active: true },
        images: [],
      },
    ];
    const createdProducts = [
      await testPostMin(
        app,
        '/products',
        {
          code: '00000001',
          name: 'Product 1',
          model: 'Model 1',
          price: 51.45,
          quantityInStock: 5,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
        },
        rootToken,
        HttpStatus.CREATED,
      ),
      await testPostMin(
        app,
        '/products',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100.4,
          quantityInStock: 4,
          active: false,
          brandId: brandId1,
          categoryId: categoryId1,
        },
        rootToken,
        HttpStatus.CREATED,
      ),
      await testPostMin(
        app,
        '/products',
        {
          code: '00000003',
          name: 'Product 3',
          model: 'Model 3',
          price: 20,
          quantityInStock: 56,
          brandId: brandId2,
          categoryId: categoryId2,
        },
        rootToken,
        HttpStatus.CREATED,
      ),
    ];
    testValidateProducts(createdProducts, expectedProducts);
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
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .getMany();
    testValidateProducts(products, expectedProducts);
  });

  it('should fail with multiple errors', async () => {
    const brandIds = await insertBrands({ name: 'Brand 1', active: true });
    await categoryRepo.bulkCreate([{ name: 'Category 1', active: true }]);
    const data = {
      code: 1,
      name: 1.1,
      model: true,
      price: null,
      quantityInStock: 1.1,
      active: 'true',
      brandId: [],
      categoryId: {},
    };
    const response = await testPostMin(
      app,
      '/products',
      data,
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await productRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: {
        code: CodeMessage.INVALID,
        name: NameMessage.INVALID,
        model: ModelMessage.INVALID,
        price: PriceMessage.NULL,
        quantityInStock: QuantityInStockMessage.INT,
        active: ActiveMessage.INVALID,
        brandId: BrandIdMessage.STRING,
        categoryId: CategoryIdMessage.STRING,
      },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
