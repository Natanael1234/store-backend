import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductConfigs } from '../../../../src/modules/stock/product/configs/product/product.configs';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidListMessage } from '../../../../src/modules/system/messages/uuid-list/uuid-list.messages';
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
} from '../../../../src/test/product/test-product-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('ProductController (e2e) - get/products (categoryIds)', () => {
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

  async function createFindScenario() {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
    );
    const [categoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true },
    );
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
        {
          code: 'C001',
          name: 'Product 1',
          model: 'M0001',
          price: 9.12,
          quantityInStock: 3,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
        },
        {
          code: 'C002',
          name: 'Product 2',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
        },
        {
          code: 'C003',
          name: 'Product 3',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          brandId: brandId1,
          categoryId: categoryId2,
        },
        {
          code: 'C004',
          name: 'Product 4',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: true,
          brandId: brandId1,
          categoryId: categoryId2,
        },
      );

    return [categoryId1, categoryId2, categoryId3];
  }

  const CategoryIdMessage = new UuidListMessage('category ids', {
    maxLength: ProductConfigs.FILTER_CATEGORY_IDS_MAX_LENGTH,
  });

  it('should filter by categoryId when receives array of categoryIds', async () => {
    const [categoryId1] = await createFindScenario();
    const regs = await productRepo
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
      .where(CategoryConstants.CATEGORY_ID_IN, { categoryIds: [categoryId1] })
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: [categoryId1] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should return empty list when category is not found', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          categoryIds: ['f136f640-90b7-11ed-a2a0-fd911f8f7f38'],
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: [],
    });
  });

  it('should not filter by categoryId when receives empty array', async () => {
    const [categoryId1, categoryId2, categoryId3] = await createFindScenario();
    const regs = await productRepo
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
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: [] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should filter by categoryId when receives array with maximum allowed size', async () => {
    const [categoryId1, categoryId2, categoryId3] = await createFindScenario();
    const categoryIds = Array.from(
      { length: ProductConfigs.FILTER_CATEGORY_IDS_MAX_LENGTH },
      (_, i) => uuidv4(),
    );
    categoryIds[0] = categoryId1;
    categoryIds[1] = categoryId2;

    const regs = await productRepo
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
      .where(ProductConstants.PRODUCT_CATEGORY_ID_IN, { categoryIds }) // TODO: test. Was product.category before
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should reject when categoryIds is longer than allowed', async () => {
    const [categoryId1, categoryId2, categoryId3] = await createFindScenario();
    const categoryIds = Array.from(
      { length: ProductConfigs.FILTER_CATEGORY_IDS_MAX_LENGTH + 1 },
      (_, i) => uuidv4(),
    );
    categoryIds[0] = categoryId1;
    categoryIds[1] = categoryId2;
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should not filter by categoryId when receives null', async () => {
    await createFindScenario();
    const regs = await productRepo
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
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: null }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should not filter by categoryId when receives undefined', async () => {
    await createFindScenario();
    const regs = await productRepo
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
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: undefined }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should reject when categoryIds is number', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: 1 }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when categoryIds is boolean', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: true }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when categoryIds is string', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: '[]' }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when categoryIds is object', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: {} }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should accept when categoryIds item is valid', async () => {
    const [categoryId1] = await createFindScenario();
    const regs = await productRepo
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
      .where(CategoryConstants.CATEGORY_ID_IN, { categoryIds: [categoryId1] })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: [categoryId1] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should reject when categoryIds item is null', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: [null] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when categoryIds item is undefined', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: [undefined] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it.skip('should reject when categoryIds item is number', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: [1] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when categoryIds item is boolean', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: [true] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when categoryIds item is invalid string', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: ['not-a-valid-uuid'] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when categoryIds item is array', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: [[]] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when categoryIds item is object', async () => {
    await createFindScenario();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ categoryIds: [{}] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { categoryIds: CategoryIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
