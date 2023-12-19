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
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { ProductOrder } from '../../../../enums/product-order/product-order.enum';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

describe('ProductService.find (orderBy)', () => {
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

  it('should order by ["name_asc", "active_asc"]', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_ASC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_ASC],
      results: regs,
    });
  });

  it('should order by ["name_asc", "active_desc"]', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await productService.find({
      orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_DESC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_DESC],
      results: regs,
    });
  });

  it('should order by ["name_desc", "active_asc"]', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.DESC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      results: regs,
    });
  });

  it('should order by ["name_desc", "active_desc"]', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.DESC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await productService.find({
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_DESC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_DESC],
      results: regs,
    });
  });

  it('should use default order when orderBy is null', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: null,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is undefined', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: undefined,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is string', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: '[]' as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains repeated column', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: ['invadlid_asc'] as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is number', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: undefined,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is number', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: 1 as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is boolean', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: true as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is array', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: [] as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is object', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: {} as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid string item', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: ['invalid_asc'] as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid number item', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: [1] as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid boolean item', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: [true] as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid array item', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: [[]] as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid object item', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [productId1, productId2, productId3, productId4] =
      await insertProducts(
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
          name: 'Product 1',
          model: 'M0002',
          price: 500,
          quantityInStock: 9,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C003',
          name: 'Product 2',
          model: 'M0003',
          price: 54.3,
          quantityInStock: 100,
          active: true,
          categoryId: categoryId1,
          brandId: brandId1,
        },
        {
          code: 'C004',
          name: 'Product 2',
          model: 'M0003',
          price: 4.33,
          quantityInStock: 1200,
          active: false,
          categoryId: categoryId1,
          brandId: brandId1,
        },
      );
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
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find({
      orderBy: [{}] as unknown as ProductOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });
});
