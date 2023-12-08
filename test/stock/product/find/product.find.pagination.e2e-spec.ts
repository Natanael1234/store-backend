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
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
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

describe('ProductController (e2e) - get/producs (pagination)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  const count = 15;
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

  it('should paginate without sending pagination params', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const data = Array.from(Array(15), (x, i) => ({
      code: `C00${i + 1}`,
      name: `Product ${i + 1}`,
      model: `M-0000${i + 1}`,
      price: 54.3,
      quantityInStock: 100,
      active: true,
      categoryId: categoryId1,
      brandId: brandId1,
    }));
    await insertProducts(...data);
    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await productRepo
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
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      `/products`,
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should paginate when params contains valid paramaters', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const data = Array.from(Array(15), (x, i) => ({
      code: `C00${i + 1}`,
      name: `Product ${i + 1}`,
      model: `M-0000${i + 1}`,
      price: 54.3,
      quantityInStock: 100,
      active: true,
      categoryId: categoryId1,
      brandId: brandId1,
    }));
    await insertProducts(...data);
    const page = 2;
    const pageSize = 3;
    const regs = await productRepo
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
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ page, pageSize }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  // page

  describe('page', () => {
    it('should paginate when page is minimum allowed', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.MIN_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when page is greater than allowed', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.MIN_PAGE + 1;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when page is very great', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.MIN_PAGE + 1000;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate using default page when page is null', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page: null }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate using default page when page is undefined', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is float', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page: 1.1 }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is boolean', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page: true }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is object', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page: {} }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is array', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page: [] }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is string', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ page: '1' }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });
  });

  // pageSize

  describe('pageSize', () => {
    it('should paginate when pageSize is minimum allowed', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ pageSize }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is smaller than allowed', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        {
          query: JSON.stringify({
            pageSize: PaginationConfigs.MIN_PAGE_SIZE - 1,
          }),
        },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is maximum allowed', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ pageSize }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate using maximum pageSize when pageSize is greater than allowed', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        {
          query: JSON.stringify({
            pageSize: PaginationConfigs.MAX_PAGE_SIZE + 1,
          }),
        },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is null', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ pageSize: null }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is undefined', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ pageSize: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is float', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        {
          query: JSON.stringify({
            pageSize: PaginationConfigs.MIN_PAGE_SIZE + 0.1,
          }),
        },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is boolean', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ pageSize: true }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is object', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ pageSize: {} }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is array', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ pageSize: {} }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is string', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const data = Array.from(Array(15), (x, i) => ({
        code: `C00${i + 1}`,
        name: `Product ${i + 1}`,
        model: `M-0000${i + 1}`,
        price: 54.3,
        quantityInStock: 100,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      }));
      await insertProducts(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await productRepo
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
          ProductConstants.IMAGES,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ pageSize: '1' }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });
  });
});
