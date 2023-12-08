import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import { Client } from '../../../../../../__mocks__/minio';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../test/category/test-category-utils';
import { testValidateBuckedItems } from '../../../../../../test/images/test-bucket-item-utils';
import { TestImages } from '../../../../../../test/images/test-images';
import { testValidateProductImages } from '../../../../../../test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../../test/product/test-product-utils';
import { SortConstants } from '../../../../../system/constants/sort/sort.constants';
import { Brand } from '../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../category/repositories/category.repository';
import { Product } from '../../../../product/models/product/product.entity';
import { ProductImageConstants } from '../../../constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../models/product-image/product-image.entity';
import { ProductImageService } from '../product-image.service';

describe('ProductImageService.bulkSave (main)', () => {
  let productImageService: ProductImageService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    productImageRepo = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
    productImageService = module.get<ProductImageService>(ProductImageService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  beforeEach(() => {
    Client.reset();
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

  /**
   * Image creation test scenario.
   * Create products and related entities but not images.
   * @param quantity number of products.
   * @returns products.
   */
  async function testBuildProductImageCreationScenario(quantity: 1 | 2 | 3) {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: false },
    );
    const productData = [
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
        brandId: brandId2,
        categoryId: categoryId2,
      },
    ].slice(0, quantity);
    const productIds = await insertProducts(...productData);
    return productIds;
  }

  it('product image service should be defined', () => {
    expect(productImageService).toBeDefined();
  });

  it('should both create and update images of a product', async () => {
    const [productId1, productId2] =
      await testBuildProductImageCreationScenario(2);
    const [file1, file2] = await TestImages.buildFiles(2);
    // create on image
    const ret1 = await productImageService.bulkSave(productId1, [
      {
        name: 'Image 1',
        description: 'description 1',
        active: true,
        main: true,
        file: file1,
      },
    ]);
    // update one image, create on image with metadata and create other image without metadata
    const ret2 = await productImageService.bulkSave(
      productId1,
      // one image with metadata and one image without metadata
      [
        // create
        {
          name: 'Image 2',
          description: 'description 2',
          main: true,
          active: true,
          file: file2,
        },
        // update
        {
          imageId: ret1[0].id,
          name: 'Image 1b',
          description: 'description 1b',
          main: false,
          active: false,
        },
      ],
    );

    expect(ret2).toBeDefined();

    // expected register data

    const expectedImageData = [
      // image updated
      {
        name: 'Image 1b',
        description: 'description 1b',
        image: `/private/products/${productId1}/images/${ret2[0].id}.jpg`,
        thumbnail: `/private/products/${productId1}/images/${ret2[0].id}.thumbnail.jpeg`,
        main: false,
        active: false,
        productId: productId1,
      },
      // image created with metadata
      {
        name: 'Image 2',
        description: 'description 2',
        image: `/public/products/${productId1}/images/${ret2[1].id}.png`,
        thumbnail: `/public/products/${productId1}/images/${ret2[1].id}.thumbnail.jpeg`,
        main: true,
        active: true,
        productId: productId1,
      },
    ];

    // method return

    testValidateProductImages(ret2, expectedImageData);

    // registers in database

    const images = await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .getMany();

    testValidateProductImages(images, expectedImageData);

    const bucket = Client._getBucketSnapshot('test-store-bucket');
    testValidateBuckedItems(
      [
        // image 2
        {
          path: `/public/products/${productId1}/images/${ret2[1].id}.png`,
          size: 191777,
        },
        {
          path: `/public/products/${productId1}/images/${ret2[1].id}.thumbnail.jpeg`,
          size: 5215,
        },
        // image 1 (updated)
        {
          path: `/private/products/${productId1}/images/${ret2[0].id}.jpg`,
          size: 5921,
        },
        {
          path: `/private/products/${productId1}/images/${ret2[0].id}.thumbnail.jpeg`,
          size: 2709,
        },
      ],
      bucket,
    );
  });
});
