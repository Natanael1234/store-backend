import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductConfigs } from '../../../../src/modules/stock/product/configs/product/product.configs';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { ProductMessage } from '../../../../src/modules/stock/product/messages/product/product.messages.enum';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import { testInsertBrands } from '../../../../src/test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../src/test/category/test-category-utils';
import { testInsertProducts } from '../../../../src/test/product/test-product-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');

describe('ProductController (e2e) - get/products (active)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let rootToken: string;
  let adminToken: string;
  let userToken: string;

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
    const tokens = await testBuildAuthenticationScenario(module);
    userToken = tokens.userToken;
    adminToken = tokens.adminToken;
    rootToken = tokens.rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function createTestScenario() {
    const [categoryId1] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    const [brandId1] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
    ]);
    await testInsertProducts(productRepo, [
      {
        code: 'C001',
        name: 'Product 1',
        model: 'M0001',
        price: 9.12,
        quantityInStock: 3,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      },
      {
        code: 'C002',
        name: 'Product 2',
        model: 'M0002',
        price: 500,
        quantityInStock: 9,
        active: false,
        categoryId: categoryId1,
        brandId: brandId1,
      },
    ]);
  }

  async function findActiveProducts() {
    return objectToJSON(
      await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_CATEGORY,
          ProductConstants.CATEGORY,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_BRAND,
          ProductConstants.BRAND,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGES,
        )
        .where(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, {
          isActiveProduct: true,
        })
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }
  async function findInactiveProducts() {
    return objectToJSON(
      await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_CATEGORY,
          ProductConstants.CATEGORY,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_BRAND,
          ProductConstants.BRAND,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGES,
        )
        .where(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, {
          isActiveProduct: false,
        })
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }
  async function findAllProducts() {
    return objectToJSON(
      await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_CATEGORY,
          ProductConstants.CATEGORY,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_BRAND,
          ProductConstants.BRAND,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGES,
        )
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  describe('active = "all"', () => {
    it('should retrieve active and inactive products when active = "all" when user is root', async () => {
      await createTestScenario();
      const product = await findAllProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active and inactive products when active = "all" when user is admin', async () => {
      await createTestScenario();
      const product = await findAllProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should reject when products when active = "all" when user is basic user', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when products when active = "all" when user is not authenticated', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('active = "inactive"', () => {
    it('should retrieve inactive products when active = "inactive" when user is root', async () => {
      await createTestScenario();
      const product = await findInactiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve inactive products when active = "inactive" when user is admin', async () => {
      await createTestScenario();
      const product = await findInactiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should reject when products when active = "inactive" when user is basic user', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when products when active = "inactive" when user is not authenticated', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('active = "active"', () => {
    it('should retrieve active products when active = "active" when user is root', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active products when active = "active" when user is admin', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active products when active = "active" when user is basic user', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active products when active = "active" when user is not autenticated', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });
  });

  describe('active = null', () => {
    it('should retrieve active products when active = null when user is root', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: null }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active products when active = null when user is admin', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: null }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active products when active = null when user is basic user', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: null }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active products when active = null when user is not autenticated', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: null }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });
  });

  describe('active = undefined', () => {
    it('should retrieve active products when active = undefined when user is root', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active products when active = undefined when user is admin', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: undefined }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active products when active = undefined when user is basic user', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: undefined }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });

    it('should retrieve active products when active = undefined when user is not autenticated', async () => {
      await createTestScenario();
      const product = await findActiveProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: undefined }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: product,
      });
    });
  });

  describe('active = undefined', () => {});

  describe('invalid active', () => {
    it('should reject when active is number', async () => {
      const [categoryId1, categoryId2] = await testInsertCategories(
        categoryRepo,
        [
          {
            name: 'Category 1',
            active: true,
          },
        ],
      );
      const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
        {
          name: 'Brand 1',
          active: true,
        },
      ]);
      await testInsertProducts(productRepo, [
        {
          code: 'C001',
          name: 'Product 1',
          model: 'M0001',
          price: 9.12,
          quantityInStock: 3,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C002',
          name: 'Product 2',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
          deletedAt: new Date(),
        },
      ]);
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: 1 }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when active is boolean', async () => {
      const [categoryId1, categoryId2] = await testInsertCategories(
        categoryRepo,
        [{ name: 'Category 1', active: true }],
      );
      const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
        {
          name: 'Brand 1',
          active: true,
        },
      ]);
      await testInsertProducts(productRepo, [
        {
          code: 'C001',
          name: 'Product 1',
          model: 'M0001',
          price: 9.12,
          quantityInStock: 3,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C002',
          name: 'Product 2',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
          deletedAt: new Date(),
        },
      ]);
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: true }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when active is array', async () => {
      const [categoryId1, categoryId2] = await testInsertCategories(
        categoryRepo,
        [{ name: 'Category 1', active: true }],
      );
      const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
        {
          name: 'Brand 1',
          active: true,
        },
      ]);
      await testInsertProducts(productRepo, [
        {
          code: 'C001',
          name: 'Product 1',
          model: 'M0001',
          price: 9.12,
          quantityInStock: 3,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C002',
          name: 'Product 2',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
          deletedAt: new Date(),
        },
      ]);
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: [] }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when active is object', async () => {
      const [categoryId1, categoryId2] = await testInsertCategories(
        categoryRepo,
        [{ name: 'Category 1', active: true }],
      );
      const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: true },
      ]);
      await testInsertProducts(productRepo, [
        {
          code: 'C001',
          name: 'Product 1',
          model: 'M0001',
          price: 9.12,
          quantityInStock: 3,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C002',
          name: 'Product 2',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
          deletedAt: new Date(),
        },
      ]);
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: {} }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when active is invalid string', async () => {
      const [categoryId1, categoryId2] = await testInsertCategories(
        categoryRepo,
        [{ name: 'Category 1', active: true }],
      );
      const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
        { name: 'Brand 1', active: true },
      ]);
      await testInsertProducts(productRepo, [
        {
          code: 'C001',
          name: 'Product 1',
          model: 'M0001',
          price: 9.12,
          quantityInStock: 3,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C002',
          name: 'Product 2',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
          deletedAt: new Date(),
        },
      ]);
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: 'invalid' }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });
  });
});
