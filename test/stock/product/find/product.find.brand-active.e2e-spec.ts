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

describe('ProductController (e2e) - get/producs (activeBrands)', () => {
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
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
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
        brandId: brandId2,
      },
    ]);
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

  async function findActiveBrandsProducts() {
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
        .where(ProductConstants.BRAND_ACTIVE_EQUALS_TO, {
          isActiveBrand: true,
        })
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  async function findInactiveBrandsProducts() {
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
        .where(ProductConstants.BRAND_ACTIVE_EQUALS_TO, {
          isActiveBrand: false,
        })
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  describe('active = "active"', () => {
    it('should retrieve products when activeBrands = "active" and user is root', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.ACTIVE }) },
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

    it('should retrieve products when activeBrands = "active" and user is admin', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.ACTIVE }) },
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

    it('should retrieve products when activeBrands = "active" and user is basic user', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.ACTIVE }) },
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

    it('should retrieve products when activeBrands = "active" and user is not authenticated', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.ACTIVE }) },
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

  describe('active = "inactive"', () => {
    it('should retrieve products when activeBrands = "inactive" and user is root', async () => {
      await createTestScenario();
      const product = await findInactiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.INACTIVE }) },
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

    it('should retrieve products when activeBrands = "inactive" and user is admin', async () => {
      await createTestScenario();
      const product = await findInactiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.INACTIVE }) },
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

    it('should not retrieve products when activeBrands = "inactive" and user is basic user', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.INACTIVE }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should not retrieve products when activeBrands = "inactive" and user is not authenticated', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.INACTIVE }) },
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

  describe('active = "all"', () => {
    it('should retrieve products when active = "all" and user is root', async () => {
      await createTestScenario();
      const product = await findAllProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.ALL }) },
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

    it('should retrieve products when active = "all" and user is admin', async () => {
      await createTestScenario();
      const product = await findAllProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.ALL }) },
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

    it('should not retrieve products when activeBrands = "all" and user is basic user', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.ALL }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.PRIVATE_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should not retrieve products when activeBrands = "all" and user is not authenticated', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: ActiveFilter.ALL }) },
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

  describe('active = null', () => {
    it('should retrieve products when activeBrands = null and user is root', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: null }) },
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

    it('should retrieve products when activeBrands = null and user is admin', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: null }) },
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

    it('should retrieve products when activeBrands = null and user is basic user', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: null }) },
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

    it('should retrieve products when activeBrands = null and user is not authenticated', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: null }) },
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
    it('should retrieve products when activeBrands = null and user is root', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: undefined }) },
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

    it('should retrieve products when activeBrands = undefined and user is admin', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: undefined }) },
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

    it('should retrieve products when activeBrands = undefined and user is basic user', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: undefined }) },
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

    it('should retrieve products when activeBrands = undefined and user is not authenticated', async () => {
      await createTestScenario();
      const product = await findActiveBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ activeBrands: undefined }) },
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
});
