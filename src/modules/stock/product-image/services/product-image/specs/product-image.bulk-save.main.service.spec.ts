import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
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
import { ImagesMetadataMessage } from '../../../../../system/decorators/images-metadata/messages/images-metadata/images-metadata.messages.enum';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
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
    const files = await TestImages.buildFiles(3);
    const imagesProduct1 = await productImageService.bulkSave(
      productId1,
      files.slice(0, 1),
      {
        metadatas: [
          {
            imageIdx: 0,
            name: 'Image 1',
            description: 'description 1',
            active: true,
            main: true,
          },
        ],
      },
    );
    const imagesProduct2 = await productImageService.bulkSave(
      productId1,
      files.slice(1, 3), // one image with metadata and one image without metadata
      {
        metadatas: [
          // create
          {
            imageIdx: 0,
            name: 'Image 2',
            description: 'description 2',
            main: true,
            active: true,
          },
          // update
          {
            imageId: imagesProduct1[0].id,
            name: 'Image 1b',
            description: 'description 1b',
            main: false,
            active: false,
          },
        ],
      },
    );

    expect(imagesProduct2).toBeDefined();
    // images in the cloud storage
    const expectedBucketData = [
      // image 1
      {
        productId: productId1,
        isThumbnail: false,
        extension: 'jpg',
        size: 5921,
      },
      // thumbnail 1
      {
        productId: productId1,
        isThumbnail: true,
        extension: 'jpeg',
        size: 2709,
      },
      // image 2
      {
        productId: productId1,
        isThumbnail: false,
        extension: 'png',
        size: 191777,
      },
      // thumbnail 2
      {
        productId: productId1,
        isThumbnail: true,
        extension: 'jpeg',
        size: 5215,
      },
      // image 3
      {
        productId: productId1,
        isThumbnail: false,
        extension: 'jpg',
        size: 5921,
      },
      // thumbnail 3
      {
        productId: productId1,
        isThumbnail: true,
        extension: 'jpeg',
        size: 2709,
      },
    ];

    function validateBucket(
      expectedBucketData: {
        productId: string;
        isThumbnail: boolean;
        extension: string;
        size: number;
      }[],
    ) {
      expect(Client._getBucketsSnapshot()).toBeDefined();
      const bucket = Client._getBucketSnapshot('test-store-bucket');
      expect(bucket).toBeDefined();
      expect(Object.keys(bucket)).toHaveLength(expectedBucketData.length);

      const savedFilenames = [...new Set(bucket.map((item) => item.name))];
      expect(savedFilenames).toHaveLength(bucket.length);

      testValidateBuckedItems(expectedBucketData, bucket);

      return bucket;
    }

    const bucket = validateBucket(expectedBucketData);

    // expected register data

    const expectedRegisterData = [
      {
        id: productId1,
        images: [
          {
            name: null,
            description: null,
            image: bucket[4].name,
            thumbnail: bucket[5].name,
            main: false,
            active: false,
            productId: productId1,
          },
          {
            name: 'Image 1b',
            description: 'description 1b',
            image: bucket[0].name,
            thumbnail: bucket[1].name,
            main: false,
            active: false,
            productId: productId1,
          },
          {
            name: 'Image 2',
            description: 'description 2',
            image: bucket[2].name,
            thumbnail: bucket[3].name,
            main: true,
            active: true,
            productId: productId1,
          },
        ],
      },
      {
        id: productId2,
        images: [],
      },
    ];

    // method return

    testValidateProductImages(imagesProduct2, expectedRegisterData[0].images);

    // registers in database

    const imageRegisters = await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .getMany();

    testValidateProductImages(imageRegisters, expectedRegisterData[0].images);
  });

  it('should reject when both imageFiles and metadatas are empty', async () => {
    // create test scenario

    const [productId1, productId2] =
      await testBuildProductImageCreationScenario(2);
    const files = await TestImages.buildFiles(3);

    // create a product

    await productImageService.bulkSave(productId1, files.slice(0, 1), {
      metadatas: [
        {
          imageIdx: 0,
          name: 'Image 1',
          description: 'Description 1',
          active: true,
          main: true,
        },
      ],
    });

    const imagesBefore = await productImageRepo.find();

    const fn = () =>
      productImageService.bulkSave(productId1, [], {
        metadatas: [],
      });

    await expect(fn()).rejects.toThrow(UnprocessableEntityException);

    const imagesAfter = await productImageRepo.find();
    expect(imagesBefore).toStrictEqual(imagesAfter);

    await expect(fn()).rejects.toThrow(
      ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
    );

    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when both imageFiles and metadatas are null', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imagesBefore = await productImageRepo.find();
    const fn = () =>
      productImageService.bulkSave(productId1, null, {
        metadatas: null,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const imagesAfter = await productImageRepo.find();
    expect(imagesBefore).toStrictEqual(imagesAfter);
    await expect(fn()).rejects.toThrow(
      ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
    );
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when both imageFiles and metadatas is undefined', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imagesBefore = await productImageRepo.find();
    const fn = () =>
      productImageService.bulkSave(productId1, undefined, {
        metadatas: undefined,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const imagesAfter = await productImageRepo.find();
    expect(imagesBefore).toStrictEqual(imagesAfter);
    await expect(fn()).rejects.toThrow(
      ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
    );
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when both imageFiles and metadatas are empty', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imagesBefore = await productImageRepo.find();
    const fn = () =>
      productImageService.bulkSave(productId1, [], {
        metadatas: [],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const imagesAfter = await productImageRepo.find();
    expect(imagesBefore).toStrictEqual(imagesAfter);
    await expect(fn()).rejects.toThrow(
      ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
    );
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when imageFiles is empty, metadatas is null', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imagesBefore = await productImageRepo.find();
    const fn = () =>
      productImageService.bulkSave(productId1, [], {
        metadatas: null,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const imagesAfter = await productImageRepo.find();
    expect(imagesBefore).toStrictEqual(imagesAfter);
    await expect(fn()).rejects.toThrow(
      ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
    );
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
