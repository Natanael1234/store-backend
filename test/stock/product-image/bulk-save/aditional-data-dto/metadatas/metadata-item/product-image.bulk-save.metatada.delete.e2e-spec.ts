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

const DeleteMessage = new BoolMessage('delete');

describe('ProductImageController (e2e) - post /product-images/:productId/images/bulk (metadata.delete)', () => {
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

  async function getImages() {
    return await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .withDeleted()
      .getMany();
  }

  async function createDeletionTestScenario() {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1, productId2] = await insertProducts(
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
    );
    const imageFiles = await TestImages.buildFiles(3);
    const ret1_2 = await productImageService.bulkSave(productId1, [
      { name: 'Image 1', active: false, file: imageFiles[0] },
      { name: 'Image 2', active: true, file: imageFiles[1] },
    ]);
    const ret3 = await productImageService.bulkSave(productId2, [
      { name: 'Image 3', active: true, file: imageFiles[2] },
    ]);

    const products = await productRepo
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
      .withDeleted()
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.IMAGES_NAME, SortConstants.ASC)
      .getMany();
    return products;
  }

  describe('create', () => {
    it('should accept create image when metadata.delete is true and metadata.fileIdx is defined', async () => {
      const products = await createDeletionTestScenario();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { name: 'Image 4', delete: true, fileIdx: 0 },
          ]),
        },
        [
          {
            field: 'files',
            buffer: imageFiles[0].buffer,
            filepath: 'caramelo.jpg',
          },
        ],
        rootToken,
        HttpStatus.CREATED,
      );

      const expectedResults = [
        products[0].images[0],
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(response, expectedResults.slice(0, 2));
      const images = await getImages();
      expect(
        images.map((image) => {
          return {
            name: image.name,
            deleted: !!image.deletedAt,
          };
        }),
      ).toEqual([
        { name: 'Image 1', deleted: false },
        { name: 'Image 2', deleted: false },
        { name: 'Image 3', deleted: false },
        { name: 'Image 4', deleted: true },
      ]);

      const bucket = Client._getBucketSnapshot('test-store-bucket');
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
            path: `/deleted/products/${products[0].id}/images/${images[3].id}.jpg`,
            size: 5921,
          },
          {
            path: `/deleted/products/${products[0].id}/images/${images[3].id}.thumbnail.jpeg`,
            size: 2709,
          },
        ],
        bucket,
      );
    });

    it('should reject create image when metadata.delete is null', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { fileIdx: 0, file: imageFiles[0], delete: null },
          ]),
        },
        [
          {
            field: 'files',
            buffer: imageFiles[0].buffer,
            filepath: 'caramelo.jpg',
          },
        ],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.delete is number', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              fileIdx: 0,
              file: imageFiles[0],
              delete: 1 as unknown as boolean,
            },
          ]),
        },
        [
          {
            field: 'files',
            buffer: imageFiles[0].buffer,
            filepath: 'caramelo.jpg',
          },
        ],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.delete is string', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              fileIdx: 0,
              file: imageFiles[0],
              delete: 'true' as unknown as boolean,
            },
          ]),
        },
        [
          {
            field: 'files',
            buffer: imageFiles[0].buffer,
            filepath: 'caramelo.jpg',
          },
        ],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.delete is array', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              fileIdx: 0,
              file: imageFiles[0],
              delete: [] as unknown as boolean,
            },
          ]),
        },
        [
          {
            field: 'files',
            buffer: imageFiles[0].buffer,
            filepath: 'caramelo.jpg',
          },
        ],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.delete is object', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              fileIdx: 0,
              file: imageFiles[0],
              delete: {} as unknown as boolean,
            },
          ]),
        },
        [
          {
            field: 'files',
            buffer: imageFiles[0].buffer,
            filepath: 'caramelo.jpg',
          },
        ],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });

  describe('update', () => {
    it('should accept update image when metadata.delete is true and metadata.imageId is defined', async () => {
      const products = await createDeletionTestScenario();
      const bucketsBefore = Client._getBucketsSnapshot();

      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { imageId: products[0].images[0].id, delete: true },
          ]),
        },
        [],
        rootToken,
        HttpStatus.CREATED,
      );

      const expectedResults = [
        { ...products[0].images[0], deleted: true },
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(response, expectedResults.slice(1, 2));
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
      const bucket = Client._getBucketSnapshot('test-store-bucket');
      testValidateBuckedItems(
        [
          // image 2
          {
            path: `/public/products/${products[0].id}/images/${products[0].images[1].id}.png`,
            size: 191777,
          },
          {
            path: `/public/products/${products[0].id}/images/${products[0].images[1].id}.thumbnail.jpeg`,
            size: 5215,
          },
          // image 3
          {
            path: `/public/products/${products[1].id}/images/${products[1].images[0].id}.jpg`,
            size: 5921,
          },
          {
            path: `/public/products/${products[1].id}/images/${products[1].images[0].id}.thumbnail.jpeg`,
            size: 2709,
          },
          // image 1
          {
            path: `/deleted/products/${products[0].id}/images/${products[0].images[0].id}.jpg`,
            size: 5921,
          },
          {
            path: `/deleted/products/${products[0].id}/images/${products[0].images[0].id}.thumbnail.jpeg`,
            size: 2709,
          },
        ],
        bucket,
      );
    });

    it('should reject update image when metadata.delete is null', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            { imageId: products[0].images[0].id, delete: null },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.delete is number', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              imageId: products[0].images[0].id,
              delete: 1 as unknown as boolean,
            },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.delete is string', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              imageId: products[0].images[0].id,
              delete: 'true' as unknown as boolean,
            },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.delete is array', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              imageId: products[0].images[0].id,
              delete: [] as unknown as boolean,
            },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.delete is object', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/' + products[0].id + '/images/bulk',
        {
          metadata: JSON.stringify([
            {
              imageId: products[0].images[0].id,
              delete: {} as unknown as boolean,
            },
          ]),
        },
        [],
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadata: DeleteMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });

  it.skip('should allow to save metadata when the difference in quantity between created and deleted is allowed', async () => {});
});
