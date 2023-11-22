import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../../../../.jest/test-config.module';
import { Client } from '../../../../../../../../../../__mocks__/minio';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../../../../../test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../../../../test/category/test-category-utils';
import { testValidateBuckedItems } from '../../../../../../../../../../test/images/test-bucket-item-utils';
import { TestImages } from '../../../../../../../../../../test/images/test-images';
import { testValidateProductImages } from '../../../../../../../../../../test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../../../../../../test/product/test-product-utils';
import { SortConstants } from '../../../../../../../../../system/constants/sort/sort.constants';
import { ImagesMetadataMessage } from '../../../../../../../../../system/decorators/images-metadata/messages/images-metadata/images-metadata.messages.enum';
import { ExceptionText } from '../../../../../../../../../system/messages/exception-text/exception-text.enum';
import { Brand } from '../../../../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../../../../category/repositories/category.repository';
import { ProductConstants } from '../../../../../../../../product/constants/product/product-entity.constants';
import { Product } from '../../../../../../../../product/models/product/product.entity';
import { ProductImageConstants } from '../../../../../../../constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../../../../../models/product-image/product-image.entity';
import { ProductImageService } from '../../../../../product-image.service';

describe('ProductImageService.bulkSave (metadata.main)', () => {
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
    const files = await TestImages.buildFiles(3);
    const ret1_2 = await productImageService.bulkSave(
      productId1,
      files.slice(0, 2),
      {
        metadatas: [
          {
            name: 'Image 1',
            main: true,
            active: false,
            imageIdx: 0,
          },
          {
            name: 'Image 2',
            main: false,
            active: true,
            imageIdx: 1,
          },
        ],
      },
    );
    const ret3 = await productImageService.bulkSave(
      productId2,
      files.slice(2),
      {
        metadatas: [
          {
            name: 'Image 3',
            active: true,
            imageIdx: 0,
          },
        ],
      },
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
    const imageFiles = await TestImages.buildFiles(1);

    const ret = await productImageService.bulkSave(productId1, imageFiles, {
      metadatas: [
        {
          imageIdx: 0,
          name: 'Image 1',
          description: 'Description image 1',
          main: true,
          active: true,
        },
      ],
    });

    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    testValidateBuckedItems(
      [
        {
          productId: productId1,
          isThumbnail: false,
          extension: 'jpg',
          size: 5921,
        },
        {
          productId: productId1,
          isThumbnail: true,
          extension: 'jpeg',
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
    testValidateProductImages(ret, expectedResults);
    const images = await getImages();
    testValidateProductImages(images, expectedResults);
  });

  it('should accept create image and set a new main image for one product', async () => {
    const products = await testBuildProductImageUpdateScenario();
    const imageFiles = await TestImages.buildFiles(4);

    const ret = await productImageService.bulkSave(
      products[0].id,
      [imageFiles[3]],
      {
        metadatas: [{ imageIdx: 0, name: 'Image 4', main: true, active: true }],
      },
    );

    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    testValidateBuckedItems(
      [
        // image 1
        {
          productId: products[0].id,
          isThumbnail: false,
          extension: 'jpg',
          size: 5921,
        },
        {
          productId: products[0].id,
          isThumbnail: true,
          extension: 'jpeg',
          size: 2709,
        },
        // image 2
        {
          productId: products[0].id,
          isThumbnail: false,
          extension: 'png',
          size: 191777,
        },
        {
          productId: products[0].id,
          isThumbnail: true,
          extension: 'jpeg',
          size: 5215,
        },
        // image 3
        {
          productId: products[1].id,
          isThumbnail: false,
          extension: 'jpg',
          size: 5921,
        },
        {
          productId: products[1].id,
          isThumbnail: true,
          extension: 'jpeg',
          size: 2709,
        },
        // image 4
        {
          productId: products[0].id,
          isThumbnail: false,
          extension: 'png',
          size: 191777,
        },
        {
          productId: products[0].id,
          isThumbnail: true,
          extension: 'jpeg',
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
    testValidateProductImages(ret, [
      expectedResults[0],
      expectedResults[1],
      expectedResults[3],
    ]);
    const images = await getImages();
    testValidateProductImages(images, expectedResults);
  });

  it('should accept create image when metadata.main is undefined', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imageFiles = await TestImages.buildFiles(1);

    const ret = await productImageService.bulkSave(productId1, imageFiles, {
      metadatas: [
        {
          imageIdx: 0,
          name: 'Image 1',
          description: 'Description image 1',
          main: undefined,
          active: true,
        },
      ],
    });

    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    testValidateBuckedItems(
      [
        {
          productId: productId1,
          isThumbnail: false,
          extension: 'jpg',
          size: 5921,
        },
        {
          productId: productId1,
          isThumbnail: true,
          extension: 'jpeg',
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
    testValidateProductImages(ret, expectedResults);
    const images = await getImages();
    testValidateProductImages(images, expectedResults);
  });

  it('should reject create image when metadata.main is null', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ main: null, imageIdx: 0 }],
      });

    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.MAIN_IS_NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create image when metadata.main is number', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const imageFiles = await TestImages.buildFiles(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ main: 1 as unknown as boolean, imageIdx: 0 }],
      });

    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.MAIN_IS_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create image when metadata.main is string', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ main: 'true' as unknown as boolean, imageIdx: 0 }],
      });

    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.MAIN_IS_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create image when metadata.main is array', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ main: [] as unknown as boolean, imageIdx: 0 }],
      });

    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.MAIN_IS_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create image when metadata.main is object', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ main: {} as unknown as boolean, imageIdx: 0 }],
      });

    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.MAIN_IS_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });

  it('should reject create images when receives multiple metadata.main for the same product', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const bucketsBefore = Client._getBucketsSnapshot();
    const imageFiles = await TestImages.buildFiles(2);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [
          { main: true, imageIdx: 0 },
          { main: true, imageIdx: 1 },
        ],
      });

    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.MULTIPLE_MAINS },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const images = await getImages();
    expect(images).toHaveLength(0);
    expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
  });
});