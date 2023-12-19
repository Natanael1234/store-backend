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
import { DeletedFilter } from '../../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
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

describe('ProductController (e2e) - get/producs (deletedBrands)', () => {
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
      { name: 'Brand 2', active: true, deletedAt: new Date() },
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
        .withDeleted()
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_BRAND,
          ProductConstants.BRAND,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_CATEGORY,
          ProductConstants.CATEGORY,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGE,
        )
        .withDeleted()
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  async function findNotDeletedBrandsProducts() {
    return objectToJSON(
      await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_BRAND,
          ProductConstants.BRAND,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_CATEGORY,
          ProductConstants.CATEGORY,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGE,
        )
        .where(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, {
          isActiveProduct: true,
        })
        .andWhere(ProductConstants.BRAND_ACTIVE_EQUALS_TO, {
          isActiveBrand: true,
        })
        .andWhere(ProductConstants.BRAND_DELETED_AT_IS_NULL)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  async function findDeletedBrandsProducts() {
    return objectToJSON(
      await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .withDeleted()
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_BRAND,
          ProductConstants.BRAND,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_CATEGORY,
          ProductConstants.CATEGORY,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGES,
        )
        .withDeleted()
        .where(ProductConstants.BRAND_DELETED_AT_IS_NOT_NULL)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany(),
    );
  }

  describe('deleted = "not_deleted"', () => {
    it('should retrieve products when deletedBrands = "not_deleted" and user is root', async () => {
      await createTestScenario();
      const products = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.NOT_DELETED }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: products,
      });
    });

    it('should retrieve products deletedBrands = "not_deleted" and user is admin', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.NOT_DELETED }) },
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

    it('should retrieve products when deletedBrands = "not_deleted" and user is basic user', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.NOT_DELETED }) },
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

    it('should retrieve products when deletedBrands = "not_deleted" and user is not authenticated', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.NOT_DELETED }) },
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

  describe('deleted = "deleted"', () => {
    it('should retrieve products when deletedBrands = "deleted" and user is root', async () => {
      await createTestScenario();
      const product = await findDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.DELETED }) },
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

    it('should retrieve products when deletedBrands = "deleted" and user is admin', async () => {
      await createTestScenario();
      const product = await findDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.DELETED }) },
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

    it('should not retrieve products when deletedBrands = "deleted" and user is basic user', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.DELETED }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should not retrieve products when deletedBrands = "deleted" and user is not authenticated', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.DELETED }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('deleted = "all"', () => {
    it('should retrieve products when deletedBrands = "all" and user is root', async () => {
      await createTestScenario();
      const product = await findAllProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.ALL }) },
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

    it('should retrieve products when not_deleted = "all" and user is admin', async () => {
      await createTestScenario();
      const product = await findAllProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.ALL }) },
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

    it('should not retrieve products when deletedBrands = "all" and user is basic user', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.ALL }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should not retrieve products when deletedBrands = "all" and user is not authenticated', async () => {
      await createTestScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: DeletedFilter.ALL }) },
        null,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('deleted = null', () => {
    it('should retrieve products when deletedBrands = null and user is root', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: null }) },
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

    it('should retrieve products when deletedBrands = null and user is admin', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: null }) },
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

    it('should retrieve products when deletedBrands = null and user is basic user', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: null }) },
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

    it('should retrieve products when deletedBrands = null and user is not authenticated', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: null }) },
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

  describe('deleted = undefined', () => {
    it('should retrieve products when deletedBrands = null and user is root', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: undefined }) },
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

    it('should retrieve products when deletedBrands = undefined and user is admin', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: undefined }) },
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

    it('should retrieve products when deletedBrands = undefined and user is basic user', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: undefined }) },
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

    it('should retrieve products when deletedBrands = undefined and user is not authenticated', async () => {
      await createTestScenario();
      const product = await findNotDeletedBrandsProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deletedBrands: undefined }) },
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
