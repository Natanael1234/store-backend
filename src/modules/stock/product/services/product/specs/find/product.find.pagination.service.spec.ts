import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../../../test/product/test-product-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

describe('ProductService.find (pagination)', () => {
  let productService: ProductService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  const count = 15;

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
    const response = await productService.find();
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when pagination params is null', async () => {
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
    const response = await productService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when pagination params is undefined', async () => {
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
    const response = await productService.find(undefined);
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when params is empty', async () => {
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
    const response = await productService.find({});
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await productService.find({ page, pageSize });
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
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
      const response = await productService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({ page: null });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({ page: undefined });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({ page: 1.1 });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        page: true as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        page: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        page: [] as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        page: '1' as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({ pageSize });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        pageSize: PaginationConfigs.MIN_PAGE_SIZE - 1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({ pageSize });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        pageSize: PaginationConfigs.MAX_PAGE_SIZE + 1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({ pageSize: null });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({ pageSize: undefined });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        pageSize: PaginationConfigs.MIN_PAGE_SIZE + 0.1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        pageSize: true as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        pageSize: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        pageSize: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await productService.find({
        pageSize: '1' as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });
});
