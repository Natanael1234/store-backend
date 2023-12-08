import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
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
  TestProductImageInsertParams,
  testInsertProductImages,
} from '../../../../../../../test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../../../test/product/test-product-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../../../system/messages/text-old/text.messages.enum';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductImage } from '../../../../../product-image/models/product-image/product-image.entity';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { ProductOrder } from '../../../../enums/product-order/product-order.enum';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

describe('ProductService.find (main)', () => {
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;
  let productService: ProductService;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    productImageRepo = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
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

  async function insertProductImages(
    ...productImages: TestProductImageInsertParams[]
  ): Promise<string[]> {
    return testInsertProductImages(productImageRepo, productImages);
  }

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

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
      .andWhere(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, { active: false })
      .andWhere(ProductConstants.PRODUCT_DELETED_AT_IS_NOT_NULL)
      .withDeleted()
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.DESC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .skip(0)
      .take(2)
      .getMany();
    const response = await productService.find({
      textQuery: 'uct  1  ',
      active: ActiveFilter.INACTIVE,
      deleted: DeletedFilter.DELETED,
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: 2,
    });
    expect(response).toEqual({
      textQuery: 'uct 1',
      count: 6,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: 2,
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      results: registers,
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
      .where(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, { active: true })
      .andWhere(ProductConstants.PRODUCT_DELETED_AT_IS_NULL)
      .take(12)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .getMany();
    const response = await productService.find();
    expect(response).toEqual({
      textQuery: undefined,
      count: 13,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_ASC],
      results: regs,
    });
  });

  it('should return empty list', async () => {
    const response = await productService.find();
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
    const fn = () =>
      productService.find({
        active: 'invalid_asc' as unknown as ActiveFilter,
        deleted: 'invalid_desc' as unknown as DeletedFilter,
        textQuery: true as unknown as string,
        page: '1' as unknown as number,
        pageSize: true as unknown as number,
        orderBy: true as unknown as ProductOrder[],
        // TODO: catetoryId and brandId
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          active: ActiveMessage.INVALID,
          deleted: DeletedMessage.INVALID,
          textQuery: TextMessageOLD.INVALID,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should use default filter values when productDto is null', async () => {
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
      .where(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default filter values when productDto is undefined', async () => {
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
      .where(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await productService.find(undefined);
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: regs,
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
      const response = await productService.find({
        active: ActiveFilter.ALL,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count: products.length,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
        results: products,
      });
    });
  });
});
