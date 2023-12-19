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
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../system/messages/text/text.messages';
import { Brand } from '../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../category/repositories/category.repository';
import { ProductConstants } from '../../../../product/constants/product/product-entity.constants';
import { Product } from '../../../../product/models/product/product.entity';
import { ProductImageConfigs } from '../../../configs/product-image/product-image.configs';
import { ProductImageConstants } from '../../../constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../models/product-image/product-image.entity';
import { ProductImageService } from '../product-image.service';

const NameMessage = new TextMessage('name', {
  maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
});

describe('ProductImageService.bulkSave (metadata.name)', () => {
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
    const ret1_2 = await productImageService.bulkSave(productId1, [
      { name: 'Image 1', main: true, active: false, file: file1 },
      { name: 'Image 2', main: false, active: true, file: file2 },
    ]);
    const ret3 = await productImageService.bulkSave(productId2, [
      { name: 'Image 3', active: true, file: file3 },
    ]);
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
      const [file1] = await TestImages.buildFiles(1);

      const retImages = await productImageService.bulkSave(productId1, [
        { name, file: file1 },
      ]);

      expect(Client._getBucketsSnapshot()).toBeDefined();
      const bucket = Client._getBucketSnapshot('test-store-bucket');
      testValidateBuckedItems(
        [
          // image 1
          {
            path: `/private/products/${productId1}/images/${retImages[0].id}.jpg`,
            size: 5921,
          },
          {
            path: `/private/products/${productId1}/images/${retImages[0].id}.thumbnail.jpeg`,
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
      testValidateProductImages(retImages, expectedResults);
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
    });

    it('should accept create image when metadata.name is empty string', async () => {
      const name = '';
      const [productId1] = await testBuildProductImageCreationScenario(1);
      const [file1] = await TestImages.buildFiles(1);

      const retImages = await productImageService.bulkSave(productId1, [
        { name, file: file1 },
      ]);

      expect(Client._getBucketsSnapshot()).toBeDefined();
      const bucket = Client._getBucketSnapshot('test-store-bucket');
      testValidateBuckedItems(
        [
          // image 1
          {
            path: `/private/products/${productId1}/images/${retImages[0].id}.jpg`,
            size: 5921,
          },
          {
            path: `/private/products/${productId1}/images/${retImages[0].id}.thumbnail.jpeg`,
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
      testValidateProductImages(retImages, expectedResults);
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
    });

    it('should accept create image when metadata.name is null', async () => {
      const name = null;
      const [productId1] = await testBuildProductImageCreationScenario(1);
      const [file1] = await TestImages.buildFiles(1);

      const retImages = await productImageService.bulkSave(productId1, [
        { name, file: file1 },
      ]);

      expect(Client._getBucketsSnapshot()).toBeDefined();
      const bucket = Client._getBucketSnapshot('test-store-bucket');
      testValidateBuckedItems(
        [
          // image 1
          {
            path: `/private/products/${productId1}/images/${retImages[0].id}.jpg`,
            size: 5921,
          },
          {
            path: `/private/products/${productId1}/images/${retImages[0].id}.thumbnail.jpeg`,
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
      testValidateProductImages(retImages, expectedResults);
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
    });

    it('should accept create image when metadata.name is undefined', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      const [file1] = await TestImages.buildFiles(1);

      const ret = await productImageService.bulkSave(productId1, [
        { name: undefined, file: file1 },
      ]);

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
      testValidateProductImages(ret, expectedResults);
      testValidateProductImages(images, expectedResults);
    });

    it('should reject create image when metadata.name is longer than allowed', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file1] = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(productId1, [
          {
            name: 'a'.repeat(ProductImageConfigs.NAME_MAX_LENGTH + 1),

            file: file1,
          },
        ]);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.getResponse()).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.MAX_LEN,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const images = await getImages();
      expect(images).toHaveLength(0);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.name is number', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file1] = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(productId1, [
          { name: 1 as unknown as string, file: file1 },
        ]);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.getResponse()).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.INVALID,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const images = await getImages();
      expect(images).toHaveLength(0);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.name is boolean', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file1] = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(productId1, [
          { name: true as unknown as string, file: file1 },
        ]);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.getResponse()).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.INVALID,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const images = await getImages();
      expect(images).toHaveLength(0);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.name is array', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file1] = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(productId1, [
          { name: [] as unknown as string, file: file1 },
        ]);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.getResponse()).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.INVALID,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const images = await getImages();
      expect(images).toHaveLength(0);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.name is object', async () => {
      const [productId1] = await testBuildProductImageCreationScenario(1);
      await testBuildProductImageCreationScenario(1);
      const bucketsBefore = Client._getBucketsSnapshot();
      const [file1] = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(productId1, [
          { name: {} as unknown as string, file: file1 },
        ]);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.getResponse()).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.INVALID,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

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

      const ret = await productImageService.bulkSave(products[0].id, [
        { name, imageId: products[0].images[0].id },
      ]);

      const expectedResults = [
        { ...products[0].images[0], name },
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(ret, expectedResults.slice(0, 2));
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should accept update image when metadata.name is empty string', async () => {
      const name = '';
      const products = await testBuildProductImageUpdateScenario();
      const bucketsBefore = Client._getBucketsSnapshot();

      const ret = await productImageService.bulkSave(products[0].id, [
        { name, imageId: products[0].images[0].id },
      ]);

      const expectedResults = [
        { ...products[0].images[0], name },
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(ret, expectedResults.slice(0, 2));
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should accept update image when metadata.name is null', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const bucketsBefore = Client._getBucketsSnapshot();

      const ret = await productImageService.bulkSave(products[0].id, [
        { name: null, imageId: products[0].images[0].id },
      ]);

      const expectedResults = [
        { ...products[0].images[0], name: null },
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(ret, expectedResults.slice(0, 2));
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

      const ret = await productImageService.bulkSave(products[0].id, [
        { name: undefined, imageId: products[0].images[0].id },
      ]);

      const expectedResults = [
        products[0].images[0],
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(ret, expectedResults.slice(0, 2));
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
      const fn = () =>
        productImageService.bulkSave(products[0].id, [
          {
            name: 'A'.repeat(ProductImageConfigs.NAME_MAX_LENGTH + 1),
            imageId: products[0].images[0].id,
          },
        ]);

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.MAX_LEN,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.name is number', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imagesBefore = await getImages();
      const fn = () =>
        productImageService.bulkSave(products[0].id, [
          { name: 1 as unknown as string, imageId: products[0].images[0].id },
        ]);

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.INVALID,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.name is boolean', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const fn = () =>
        productImageService.bulkSave(products[0].id, [
          {
            name: true as unknown as string,
            imageId: products[0].images[0].id,
          },
        ]);

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.INVALID,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.name is array', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const fn = () =>
        productImageService.bulkSave(products[0].id, [
          { name: [] as unknown as string, imageId: products[0].images[0].id },
        ]);

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.INVALID,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
    });

    it('should reject update image when metadata.name is object', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const fn = () =>
        productImageService.bulkSave(products[0].id, [
          { name: {} as unknown as string, imageId: products[0].images[0].id },
        ]);

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: NameMessage.INVALID,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });
});
