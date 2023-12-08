import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../src/.jest/test-config.module';
import { Client } from '../../../../../../../src/__mocks__/minio';
import { Brand } from '../../../../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../../../src/modules/stock/category/repositories/category.repository';
import { ProductImageConfigs } from '../../../../../../../src/modules/stock/product-image/configs/product-image/product-image.configs';
import { ProductImageConstants } from '../../../../../../../src/modules/stock/product-image/constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../../../../../src/modules/stock/product-image/models/product-image/product-image.entity';
import { ProductImageService } from '../../../../../../../src/modules/stock/product-image/services/product-image/product-image.service';
import { ProductConstants } from '../../../../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { Product } from '../../../../../../../src/modules/stock/product/models/product/product.entity';
import { SortConstants } from '../../../../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../../../src/modules/system/messages/text/text.messages';
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

const NameMessage = new TextMessage('name', {
  maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
});

describe('ProductImageController (e2e) - post /product-images/:productId/images/bulk (metadata.name)', () => {
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
  async function getImages() {
    return productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .getMany();
  }

  describe('create', () => {
    it('should accept create image when metadata.name has maximum allowed length', async () => {
      const name = 'a'.repeat(ProductImageConfigs.NAME_MAX_LENGTH);
      const [productId1] = await testBuildProductImageCreationScenario(1);
      const [file] = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + productId1 + '/images/bulk',
        { metadata: JSON.stringify([{ name, fileIdx: 0 }]) },
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
            path: `/private/products/${productId1}/images/${response[0].id}.jpg`,
            size: 5921,
          },
          {
            path: `/private/products/${productId1}/images/${response[0].id}.thumbnail.jpeg`,
            size: 2709,
          },
        ],
        bucket,
      );
      const expectedResults = [
        {
          name,
          description: null,
          image: bucket[0].name,
          thumbnail: bucket[1].name,
          main: false,
          active: false,
          productId: productId1,
        },
      ];
      testValidateProductImages(response, expectedResults);
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
    });

    it('should accept create image when metadata.name is empty string', async () => {
      const name = '';
      const [productId1] = await testBuildProductImageCreationScenario(1);
      const [file] = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + productId1 + '/images/bulk',
        { metadata: JSON.stringify([{ name, fileIdx: 0 }]) },
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
            path: `/private/products/${productId1}/images/${response[0].id}.jpg`,
            size: 5921,
          },
          {
            path: `/private/products/${productId1}/images/${response[0].id}.thumbnail.jpeg`,
            size: 2709,
          },
        ],
        bucket,
      );
      const expectedResults = [
        {
          name,
          description: null,
          image: bucket[0].name,
          thumbnail: bucket[1].name,
          main: false,
          active: false,
          productId: productId1,
        },
      ];
      testValidateProductImages(response, expectedResults);
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
    });

    it('should accept create image when metadata.name is null', async () => {
      const name = null;
      const [productId1] = await testBuildProductImageCreationScenario(1);
      const [file] = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + productId1 + '/images/bulk',
        { metadata: JSON.stringify([{ name, fileIdx: 0 }]) },
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
            path: `/private/products/${productId1}/images/${response[0].id}.jpg`,
            size: 5921,
          },
          {
            path: `/private/products/${productId1}/images/${response[0].id}.thumbnail.jpeg`,
            size: 2709,
          },
        ],
        bucket,
      );
      const expectedResults = [
        {
          name,
          description: null,
          image: bucket[0].name,
          thumbnail: bucket[1].name,
          main: false,
          active: false,
          productId: productId1,
        },
      ];
      testValidateProductImages(response, expectedResults);
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
    });

    it('should accept create image when metadata.name is undefined', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      const [file] = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + productId1 + '/images/bulk',
        { metadata: JSON.stringify([{ name: undefined, fileIdx: 0 }]) },
        [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
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
            path: `/private/products/${productId1}/images/${images[0].id}.jpg`,
            size: 5921,
          },
          {
            path: `/private/products/${productId1}/images/${images[0].id}.thumbnail.jpeg`,
            size: 2709,
          },
        ],
        bucket,
      );
      const expectedResults = [
        {
          name: null,
          description: null,
          image: bucket[0].name,
          thumbnail: bucket[1].name,
          main: false,
          active: false,
          productId: productId1,
        },
      ];
      testValidateProductImages(response, expectedResults);
      testValidateProductImages(images, expectedResults);
    });

    it('should reject create image when metadata.name is longer than allowed', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file] = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + productId1 + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              name: 'a'.repeat(ProductImageConfigs.NAME_MAX_LENGTH + 1),
              fileIdx: 0,
            },
          ]),
        },
        [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const images = await getImages();
      expect(images).toHaveLength(0);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.name is number', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file] = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + productId1 + '/images/bulk',
        { metadata: JSON.stringify([{ name: 1, fileIdx: 0 }]) },
        [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const images = await getImages();
      expect(images).toHaveLength(0);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.name is boolean', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file] = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + productId1 + '/images/bulk',
        { metadata: JSON.stringify([{ name: true, fileIdx: 0 }]) },
        [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const images = await getImages();
      expect(images).toHaveLength(0);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.name is array', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file] = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + productId1 + '/images/bulk',
        { metadata: JSON.stringify([{ name: [], fileIdx: 0 }]) },
        [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const images = await getImages();
      expect(images).toHaveLength(0);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.name is object', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file] = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + productId1 + '/images/bulk',
        { metadata: JSON.stringify([{ name: {}, fileIdx: 0 }]) },
        [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const images = await getImages();
      expect(images).toHaveLength(0);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });

  describe('update', () => {
    it('should accept update image when metadata.name has maximum allowed length', async () => {
      const name = 'A'.repeat(ProductImageConfigs.NAME_MAX_LENGTH);
      const products = await testBuildProductImageUpdateScenario();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { name, imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.CREATED,
      );
      const expectedResults = [
        { ...products[0].images[0], name },
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(response, expectedResults.slice(0, 2));
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should accept update image when metadata.name is empty string', async () => {
      const name = '';
      const products = await testBuildProductImageUpdateScenario();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { name, imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.CREATED,
      );
      const expectedResults = [
        { ...products[0].images[0], name },
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(response, expectedResults.slice(0, 2));
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should accept update image when metadata.name is null', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { name: null, imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.CREATED,
      );
      const expectedResults = [
        { ...products[0].images[0], name: null },
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(response, expectedResults.slice(0, 2));
      const images = await productImageRepo
        .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
        .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
        .getMany();
      testValidateProductImages(images, expectedResults);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should accept update image when metadata.name is undefined', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { name: undefined, imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.CREATED,
      );
      const expectedResults = [
        products[0].images[0],
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(response, expectedResults.slice(0, 2));
      const images = await productImageRepo
        .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
        .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
        .getMany();
      testValidateProductImages(images, expectedResults);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.name is longer than allowed', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imagesBefore = await getImages();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              name: 'A'.repeat(ProductImageConfigs.NAME_MAX_LENGTH + 1),
              imageId: products[0].images[0].id,
            },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.name is number', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imagesBefore = await getImages();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { name: 1, imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.name is boolean', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { name: true, imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.name is array', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { name: [], imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
    });

    it('should reject update image when metadata.name is object', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { name: {}, imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });
});
