import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testInsertBrands } from '../../../../../../../test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../../../../test/category/test-category-utils';
import { testInsertProducts } from '../../../../../../../test/product/test-product-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

// TODO: mensagem do tipo boolean. Mas recebe uma enum. Corrigir
const ActiveBrandMessage = new BoolMessage('active brands');

describe('ProductService.find (activeBrands)', () => {
  let productService: ProductService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    productService = module.get<ProductService>(ProductService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function createTestScenario() {
    const [categoryId1, categoryId2] = await testInsertCategories(
      categoryRepo,
      [{ name: 'Category 1', active: true }],
    );
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
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
  }
  async function getActiveBrandsProducts() {
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
      .where(ProductConstants.BRAND_ACTIVE_EQUALS_TO, {
        isActiveBrand: true,
      })
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
  }
  async function getInactiveBrandsProducts() {
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
      .where(ProductConstants.BRAND_ACTIVE_EQUALS_TO, {
        isActiveBrand: false,
      })
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
  }

  it('should filter products by active brands when activeBrands = "active"', async () => {
    await createTestScenario();
    const products = await getActiveBrandsProducts();
    const response = await productService.find({
      activeBrands: ActiveFilter.ACTIVE,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by inactive brands when activeBrands = "inactive"', async () => {
    await createTestScenario();
    const products = await getInactiveBrandsProducts();
    const response = await productService.find({
      activeBrands: ActiveFilter.INACTIVE,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should not filter by active or inactive brands when activeBrands = "all"', async () => {
    await createTestScenario();
    const products = await getAllProducts();
    const response = await productService.find({
      activeBrands: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by active brands when activeBrands = null', async () => {
    await createTestScenario();
    const products = await getActiveBrandsProducts();
    const response = await productService.find({ activeBrands: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by active brands when activeBrands = undefined', async () => {
    await createTestScenario();
    const products = await getActiveBrandsProducts();
    const response = await productService.find({ activeBrands: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by active brands when activeBrands is not defined', async () => {
    await createTestScenario();
    const products = await getActiveBrandsProducts();
    const response = await productService.find({});
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by active brands when findDTO is null', async () => {
    await createTestScenario();
    const products = await getActiveBrandsProducts();
    const response = await productService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by active brands when findDTO is undefined', async () => {
    await createTestScenario();
    const products = await getActiveBrandsProducts();
    const response = await productService.find(undefined);
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by active brands when findDTO is not defined', async () => {
    await createTestScenario();
    const products = await getActiveBrandsProducts();
    const response = await productService.find(undefined);
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should reject when activeBrands is number', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({ activeBrands: 1 as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { activeBrands: ActiveBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when activeBrands is boolean', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({ activeBrands: true as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { activeBrands: ActiveBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when activeBrands is invalid string', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({
        activeBrands: 'invalid' as unknown as ActiveFilter,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { activeBrands: ActiveBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when activeBrands is array', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({ activeBrands: [] as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { activeBrands: ActiveBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when activeBrands is object', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({ activeBrands: {} as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { activeBrands: ActiveBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
