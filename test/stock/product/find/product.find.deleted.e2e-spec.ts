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

const DeletedMessage = new BoolMessage('deleted');

describe('ProductController (e2e) - get/producs (deleted)', () => {
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

  async function createFindScenario() {
    const [categoryId1] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    const [brandId1] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
    ]);
    const [productId1, productId2, productId3] = await testInsertProducts(
      productRepo,
      [
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
          deletedAt: new Date(),
          brandId: brandId1,
        },
        {
          code: 'C001',
          name: 'Product 3',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      ],
    );
    return [productId1, productId2, productId3];
  }

  async function getAllProducts() {
    return productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGES,
      )
      .withDeleted()
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
  }

  async function getDeletedProducts() {
    return productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGES,
      )
      .where(ProductConstants.PRODUCT_DELETED_AT_IS_NOT_NULL)
      .withDeleted()
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
  }

  async function getNotDeletedProducts() {
    return productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGES,
      )
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
  }

  describe('deleted = "not_deleted"', () => {
    it('should retrieve not deleted products when deleted = "not_deleted" and user is root', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });

    it('should retrieve not deleted products when deleted = "not_deleted" and user is admin', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });

    it('should retrieve not deleted products when deleted = "not_deleted" and user is basic user', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });

    it('should retrieve not deleted products when deleted = "not_deleted" and user is not authenticated', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });
  });

  describe('deleted = "deleted"', () => {
    it('should retrieve deleted products when deleted = "deleted" and user is root', async () => {
      await createFindScenario();
      const regs = await getDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should retrieve deleted products when deleted = "deleted" and user is admin', async () => {
      await createFindScenario();
      const regs = await getDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 1,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should reject reject when delete = "deleted" and user is basic user', async () => {
      await createFindScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject reject when delete = "deleted" and user is basic not authenticated', async () => {
      await createFindScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
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

  describe('deleted = all', () => {
    it('should retrieve deleted and non deleted products when deleted = "all" and user is root', async () => {
      await createFindScenario();
      const allProducts = await getAllProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 3,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(allProducts),
      });
    });

    it('should retrieve deleted and non deleted products when deleted = "all" and user is admin', async () => {
      await createFindScenario();
      const allProducts = await getAllProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 3,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(allProducts),
      });
    });

    it('should reject when deleted = "all" and user is basic user', async () => {
      await createFindScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
        userToken,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toEqual({
        error: ExceptionText.UNAUTHORIZED,
        message: ProductMessage.DELETED_ACCESS,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when deleted = "all" and user is not authenticated', async () => {
      await createFindScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
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
    it('should retrieve not deleted products when deleted = null and user is root', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: null }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });

    it('should retrieve not deleted products when deleted = null and user is admin', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: null }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });

    it('should retrieve not deleted products when deleted = null and user is basic user', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: null }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });

    it('should retrieve not deleted products when deleted = null and user is not authenticated', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: null }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });
  });

  describe('deleted = undefined', () => {
    it('should retrieve not deleted products when deleted = undefined and user is root', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });

    it('should retrieve not deleted products when deleted = undefined and user is admin', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: undefined }) },
        adminToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });

    it('should retrieve not deleted products when deleted = undefined and user is basic user', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: undefined }) },
        userToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });

    it('should retrieve not deleted products when deleted = undefined and user is not authenticated', async () => {
      await createFindScenario();
      const products = await getNotDeletedProducts();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: undefined }) },
        null,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: 2,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });
  });

  describe('deleted is invalid', () => {
    it('should reject when deleted is invalid number', async () => {
      await createFindScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: 1 }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when deleted is invalid boolean', async () => {
      await createFindScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: true }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when deleted is invalid array', async () => {
      await createFindScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: [] }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when deleted is invalid object', async () => {
      await createFindScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: {} }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when deleted is invalid string', async () => {
      await createFindScenario();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ deleted: 'true' }) },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });
  });
});
