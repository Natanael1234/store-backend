import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductImage } from '../../../../src/modules/stock/product-image/models/product-image/product-image.entity';
import { ProductConfigs } from '../../../../src/modules/stock/product/configs/product/product.configs';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { ProductOrder } from '../../../../src/modules/stock/product/enums/product-order/product-order.enum';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../src/modules/system/messages/text-old/text.messages.enum';
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
  TestProductImageInsertParams,
  testInsertProductImages,
} from '../../../../src/test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../src/test/product/test-product-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

describe('ProductController (e2e) - get/producs (main)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;

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
    productImageRepo = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
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

  async function insertProductImages(
    ...productImages: TestProductImageInsertParams[]
  ): Promise<string[]> {
    return testInsertProductImages(productImageRepo, productImages);
  }

  it('should find products with filtering parameters', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const productData = [];
    let counter = 1;
    for (let i = 0; i < 3; i++) {
      for (let name of ['Product 1', 'Product 2']) {
        for (let active in [true, false]) {
          for (const deletedAt of [null, new Date()]) {
            productData.push({
              code: `${counter}`,
              name,
              model: 'A',
              price: 1,
              quantityInStock: 5,
              active,
              deletedAt,
              brandId: brandId1,
              categoryId: categoryId1,
            });
            counter++;
          }
        }
      }
    }
    await insertProducts(...productData);
    const registers = await productRepo
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
      .andWhere('LOWER(product.name) LIKE :textQuery', { textQuery: '%uct%1%' })
      .andWhere(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, {
        isActiveProduct: false,
      })
      .andWhere(ProductConstants.PRODUCT_DELETED_AT_IS_NOT_NULL)
      .withDeleted()
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.DESC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .skip(0)
      .take(2)
      .getMany();
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          textQuery: 'uct  1  ',
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.DELETED,
          orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: 2,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: 'uct 1',
      count: 6,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: 2,
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      results: objectToJSON(registers),
    });
    expect(response.results[0].images).toHaveLength(0);
  });

  it('should find products without parameters and pagination dtos', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const productData: any[] = Array.from(Array(15), (x, idx) => ({
      code: `00000000${idx + 1}`,
      name: `Product ${idx + 1}`,
      model: `Model ${idx + 1}`,
      price: 100,
      quantityInStock: 4,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    }));
    productData[3].active = false;
    productData[4].deletedAt = new Date();
    await insertProducts(...productData);
    const regs = await productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGE,
        ProductConstants.IMAGE_MAIN_EQUALS_TO,
        { main: true },
      )
      .where(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, {
        isActiveProduct: true,
      })
      .andWhere(ProductConstants.PRODUCT_DELETED_AT_IS_NULL)
      .take(12)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
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
      count: 13,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
    });
  });

  it('should return empty list', async () => {
    const response = await testGetMin(
      app,
      `/products`,
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_ASC],
      results: [],
    });
  });

  it('should reject when data contains multiple errors', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
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
        code: 'C001',
        name: 'Product 3',
        model: 'M0003',
        price: 54.3,
        quantityInStock: 100,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
      },
    );
    const response = await testGetMin(
      app,
      `/products`,
      {
        query: JSON.stringify({
          active: 'invalid_asc',
          deleted: 'invalid_desc',
          textQuery: true,
          page: '1',
          pageSize: true,
          orderBy: true,
          // TODO: catetoryId and brandId
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: {
        active: ActiveMessage.INVALID,
        deleted: DeletedMessage.INVALID,
        textQuery: TextMessageOLD.INVALID,
      },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  describe('product list images and its images', () => {
    it('should list products and its main images', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const [productId1, productId2, productId3] = await insertProducts(
        {
          code: '00000001',
          name: 'Product 1',
          model: 'Model 1',
          price: 50,
          quantityInStock: 5,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
        },
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: brandId1,
          categoryId: categoryId1,
        },
        {
          code: '00000003',
          name: 'Product 3',
          model: 'Model 3',
          price: 20,
          quantityInStock: 0,
          brandId: brandId1,
          categoryId: categoryId1,
        },
      );
      const [productImageId1, productImageId2, productImageId3] =
        await insertProductImages(
          {
            name: 'Image 1',
            description: 'Image 1 description',
            image: 'images/image1.jpg',
            thumbnail: 'thumbnails/images/image1.jpg',
            main: true,
            active: true,
            productId: productId1,
          },
          {
            image: 'images/image2.jpg',
            thumbnail: 'thumbnails/images/image2.jpg',
            main: false,
            active: false,
            productId: productId1,
          },
          {
            image: 'images/image3.jpg',
            thumbnail: 'thumbnails/images/image3.jpg',
            main: false,
            active: false,
            productId: productId2,
          },
        );
      const products = await productRepo
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
          ProductConstants.IMAGE,
          ProductConstants.IMAGE_MAIN_EQUALS_TO,
          { main: true },
        )
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .getMany();
      expect(products).toHaveLength(3);
      const response = await testGetMin(
        app,
        `/products`,
        { query: JSON.stringify({ active: ActiveFilter.ALL }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count: products.length,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: objectToJSON(products),
      });
    });
  });
});
