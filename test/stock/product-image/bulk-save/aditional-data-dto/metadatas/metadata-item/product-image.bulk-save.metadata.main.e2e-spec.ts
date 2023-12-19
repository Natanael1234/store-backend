import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../src/.jest/test-config.module';
import { Client } from '../../../../../../../src/__mocks__/minio';
import { Brand } from '../../../../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../../../src/modules/stock/category/repositories/category.repository';
import { ProductImageConstants } from '../../../../../../../src/modules/stock/product-image/constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../../../../../src/modules/stock/product-image/models/product-image/product-image.entity';
import { ProductImageService } from '../../../../../../../src/modules/stock/product-image/services/product-image/product-image.service';
import { ProductConstants } from '../../../../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { Product } from '../../../../../../../src/modules/stock/product/models/product/product.entity';
import { SortConstants } from '../../../../../../../src/modules/system/constants/sort/sort.constants';
import { BoolMessage } from '../../../../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ImagesMetadataMessage } from '../../../../../../../src/modules/system/messages/images-metadata/images-metadata.messages.enum';
import { ValidationPipe } from '../../../../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../../src/test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../src/test/category/test-category-utils';
import { testValidateBuckedItems } from '../../../../../../../src/test/images/test-bucket-item-utils';
import { TestImages } from '../../../../../../../src/test/images/test-images';
import { testValidateProductImages } from '../../../../../../../src/test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testUploadMin,
} from '../../../../../../utils/test-end-to-end.utils';

const MainMessage = new BoolMessage('main');

describe('ProductImageController (e2e) - post /product-images/:productId/images/bulk (metadata.main)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;
  let productImageService: ProductImageService;

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
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function getImages() {
    return productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .getMany();
  }

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

  /**
   * Create test image update scenario. Create product and related images.
   * @returns
   */
  async function testBuildProductImageUpdateScenario() {
    // create products and related data
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3', active: false },
    );
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
        { name: 'Category 4', active: false, parentPosition: 1 },
      );
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
        brandId: brandId2,
        categoryId: categoryId2,
      },
    );
    const [file1, file2, file3] = await TestImages.buildFiles(3);
    const response1_2 = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          { name: 'Image 1', main: true, active: false, fileIdx: 0 },
          { name: 'Image 2', main: false, active: true, fileIdx: 1 },
        ]),
      },
      [
        { field: 'files', buffer: file1.buffer, filepath: file1.originalname },
        { field: 'files', buffer: file2.buffer, filepath: file2.originalname },
      ],
      rootToken,
      HttpStatus.CREATED,
    );

    const response3 = await testUploadMin(
      app,
      '/product-images/' + productId2 + '/images/bulk',
      {
        metadata: JSON.stringify([
          { name: 'Image 3', active: true, fileIdx: 0 },
        ]),
      },
      [{ field: 'files', buffer: file3.buffer, filepath: file3.originalname }],
      rootToken,
      HttpStatus.CREATED,
    );
    return await productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGES,
      )
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.IMAGES_NAME, SortConstants.ASC)
      .getMany();
  }

  it('should accept create image when metadata.main is boolean', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          {
            fileIdx: 0,
            name: 'Image 1',
            description: 'Description image 1',
            main: true,
            active: true,
          },
        ]),
      },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.CREATED,
    );

    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    testValidateBuckedItems(
      [
        // image 1
        {
          path: `/public/products/${productId1}/images/${response[0].id}.jpg`,
          size: 5921,
        },
        {
          path: `/public/products/${productId1}/images/${response[0].id}.thumbnail.jpeg`,
          size: 2709,
        },
      ],
      bucket,
    );
    const expectedResults = [
      {
        name: 'Image 1',
        description: 'Description image 1',
        image: bucket[0].name,
        thumbnail: bucket[1].name,
        main: true,
        active: true,
        productId: productId1,
      },
    ];
    testValidateProductImages(response, expectedResults);
    const images = await getImages();
    testValidateProductImages(images, expectedResults);
  });

  it('should accept create image and set a new main image for one product', async () => {
    const products = await testBuildProductImageUpdateScenario();
    const [file1, file2, file3, file4] = await TestImages.buildFiles(4);
    const response = await testUploadMin(
      app,
      '/product-images/' + products[0].id + '/images/bulk',
      {
        metadata: JSON.stringify([
          { fileIdx: 0, name: 'Image 4', main: true, active: true },
        ]),
      },
      [{ field: 'files', buffer: file4.buffer, filepath: file4.originalname }],
      rootToken,
      HttpStatus.CREATED,
    );
    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    const images = await getImages();
    testValidateBuckedItems(
      [
        // image 1
        {
          path: `/private/products/${products[0].id}/images/${images[0].id}.jpg`,
          size: 5921,
        },
        {
          path: `/private/products/${products[0].id}/images/${images[0].id}.thumbnail.jpeg`,
          size: 2709,
        },
        // image 2
        {
          path: `/public/products/${products[0].id}/images/${images[1].id}.png`,
          size: 191777,
        },
        {
          path: `/public/products/${products[0].id}/images/${images[1].id}.thumbnail.jpeg`,
          size: 5215,
        },
        // image 3
        {
          path: `/public/products/${products[1].id}/images/${images[2].id}.jpg`,
          size: 5921,
        },
        {
          path: `/public/products/${products[1].id}/images/${images[2].id}.thumbnail.jpeg`,
          size: 2709,
        },
        // image 4
        {
          path: `/public/products/${products[0].id}/images/${images[3].id}.png`,
          size: 191777,
        },
        {
          path: `/public/products/${products[0].id}/images/${images[3].id}.thumbnail.jpeg`,
          size: 5215,
        },
      ],
      bucket,
    );
    const expectedResults = [
      {
        ...products[0].images[0],
        main: false,
      },
      { ...products[0].images[1], main: false },
      { ...products[1].images[0], main: true },
      {
        name: 'Image 4',
        description: null,
        image: bucket[6].name,
        thumbnail: bucket[7].name,
        main: true,
        active: true,
        productId: products[0].id,
      },
    ];
    testValidateProductImages(response, [
      expectedResults[0],
      expectedResults[1],
      expectedResults[3],
    ]);
    testValidateProductImages(images, expectedResults);
  });

  it('should accept create image when metadata.main is undefined', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          {
            fileIdx: 0,
            name: 'Image 1',
            description: 'Description image 1',
            main: undefined,
            active: true,
          },
        ]),
      },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.CREATED,
    );
    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    testValidateBuckedItems(
      [
        {
          path: `/public/products/${productId1}/images/${response[0].id}.jpg`,
          size: 5921,
        },
        {
          path: `/public/products/${productId1}/images/${response[0].id}.thumbnail.jpeg`,
          size: 2709,
        },
      ],
      bucket,
    );
    const expectedResults = [
      {
        name: 'Image 1',
        description: 'Description image 1',
        image: bucket[0].name,
        thumbnail: bucket[1].name,
        main: false,
        active: true,
        productId: productId1,
      },
    ];
    testValidateProductImages(response, expectedResults);
    const images = await getImages();
    testValidateProductImages(images, expectedResults);
  });

  it('should reject create image when metadata.main is null', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([{ main: null, fileIdx: 0 }]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: MainMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create image when metadata.main is number', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          { main: 1 as unknown as boolean, fileIdx: 0 },
        ]),
      },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: MainMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create image when metadata.main is string', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          { main: 'true' as unknown as boolean, fileIdx: 0 },
        ]),
      },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: MainMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create image when metadata.main is array', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          { main: [] as unknown as boolean, fileIdx: 0 },
        ]),
      },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: MainMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create image when metadata.main is object', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          { main: {} as unknown as boolean, fileIdx: 0 },
        ]),
      },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: MainMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });

    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create images when receives multiple metadata.main for the same product', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const [file1, file2] = await TestImages.buildFiles(2);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          { main: true, fileIdx: 0 },
          { main: true, fileIdx: 1 },
        ]),
      },
      [
        { field: 'files', buffer: file1.buffer, filepath: file1.originalname },
        { field: 'files', buffer: file2.buffer, filepath: file2.originalname },
      ],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImagesMetadataMessage.MULTIPLE_MAINS },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });
});
