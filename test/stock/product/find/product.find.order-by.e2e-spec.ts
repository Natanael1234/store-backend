import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductConfigs } from '../../../../src/modules/stock/product/configs/product/product.configs';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { ProductOrder } from '../../../../src/modules/stock/product/enums/product-order/product-order.enum';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
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

describe('ProductController (e2e) - get/producs (orderBy)', () => {
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_ASC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_DESC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_DESC],
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_DESC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_DESC],
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: null,
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: undefined,
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: '[]',
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: ['invadlid_asc'],
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: undefined,
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: 1,
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: true,
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: [],
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: {},
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          orderBy: ['invalid_asc'],
          active: ActiveFilter.ALL,
        }),
      },
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
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ orderBy: [1], active: ActiveFilter.ALL }) },
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
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ orderBy: [true], active: ActiveFilter.ALL }) },
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
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ orderBy: [[]], active: ActiveFilter.ALL }) },
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
    const response = await testGetMin(
      app,
      `/products`,
      { query: JSON.stringify({ orderBy: [{}], active: ActiveFilter.ALL }) },
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
});
