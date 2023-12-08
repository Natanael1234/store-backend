import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../src/.jest/test-config.module';
import { Client } from '../../../../../../src/__mocks__/minio';
import { Brand } from '../../../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../../src/modules/stock/category/repositories/category.repository';
import { ProductImageConstants } from '../../../../../../src/modules/stock/product-image/constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../../../../src/modules/stock/product-image/models/product-image/product-image.entity';
import { ProductImageService } from '../../../../../../src/modules/stock/product-image/services/product-image/product-image.service';
import { Product } from '../../../../../../src/modules/stock/product/models/product/product.entity';
import { SortConstants } from '../../../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ImagesMetadataMessage } from '../../../../../../src/modules/system/messages/images-metadata/images-metadata.messages.enum';
import { MutuallyExclusiveFieldsMessage } from '../../../../../../src/modules/system/messages/mutually-exclusive-fields/mutually-exclusive-fields.messages';
import { ValidationPipe } from '../../../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../src/test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../src/test/category/test-category-utils';
import { testValidateBucketItem } from '../../../../../../src/test/images/test-bucket-item-utils';
import { TestImages } from '../../../../../../src/test/images/test-images';
import { testValidateProductImages } from '../../../../../../src/test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testUploadMin,
} from '../../../../../utils/test-end-to-end.utils';

const ImageIdMessage = new MutuallyExclusiveFieldsMessage('imageId', 'fileIdx');
const FileIdxMessage = new MutuallyExclusiveFieldsMessage('fileIdx', 'imageId');

describe('ProductImageController (e2e) - post /product-images/:productId/images/bulk (additionalDataDto.metadata)', () => {
  let productImageService: ProductImageService;
  let module: TestingModule;
  let app: INestApplication;
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
    productImageService = module.get<ProductImageService>(ProductImageService);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
    Client.reset();
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

  it('should accept create when additionalDataDto.metadata is null', async () => {
    const [productId1, productId2] =
      await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify(null) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.CREATED,
    );
    expect(response).toBeDefined();
    // images in the cloud storage
    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    expect(bucket).toBeDefined();
    expect(bucket).toHaveLength(2);
    const savedFilenames = [...new Set(bucket.map((item) => item.name))];
    expect(savedFilenames).toHaveLength(bucket.length);
    // image 1
    testValidateBucketItem(
      {
        path: `/private/products/${productId1}/images/${response[0].id}.jpg`,
        size: 5921,
      },
      bucket[0],
    );
    // thumbnail of image 1
    testValidateBucketItem(
      {
        path: `/private/products/${productId1}/images/${response[0].id}.thumbnail.jpeg`,
        size: 2709,
      },
      bucket[1],
    );
    const images = await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE) // TODO: extract do constants
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC) // TODO: extract do constants
      .getMany();
    testValidateProductImages(images, [
      {
        name: null, // null when metadata is undefined
        description: null, // null when metadata is undefined
        image: bucket[0].name,
        thumbnail: bucket[1].name,
        main: false, // false when metadata is undefined
        active: false, // false when metadata is undefined
        productId: productId1,
      },
    ]);
  });

  it('should accept when additionalDataDto.metadata is undefined', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {},
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.CREATED,
    );
    expect(response).toBeDefined();
    // images in the cloud storage
    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    expect(bucket).toBeDefined();
    expect(bucket).toHaveLength(2);
    const savedFilenames = [...new Set(bucket.map((item) => item.name))];
    expect(savedFilenames).toHaveLength(bucket.length);
    // image 1
    testValidateBucketItem(
      {
        path: `/private/products/${productId1}/images/${response[0].id}.jpg`,
        size: 5921,
      },
      bucket[0],
    );
    // thumbnail of image 1
    testValidateBucketItem(
      {
        path: `/private/products/${productId1}/images/${response[0].id}.thumbnail.jpeg`,
        size: 2709,
      },
      bucket[1],
    );
    const images = await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE) // TODO: extract do constants
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC) // TODO: extract do constants
      .getMany();
    testValidateProductImages(images, [
      {
        name: null, // null when metadata is undefined
        description: null, // null when metadata is undefined
        image: bucket[0].name,
        thumbnail: bucket[1].name,
        main: false, // false when metadata is undefined
        active: false, // false when metadata is undefined
        productId: productId1,
      },
    ]);
  });

  it('should reject when metadata is number', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify(1) },
      [],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata is boolean', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify(true) },
      [],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata is string', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify('[]') },
      [],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata is object', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify({}) },
      [],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });
});
