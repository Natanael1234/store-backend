import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { Client } from '../../../../../../../__mocks__/minio';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { TestImages } from '../../../../../../../test/images/test-images';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../../../test/product/test-product-utils';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConstants } from '../../../../../product/constants/product/product-entity.constants';
import { ProductMessage } from '../../../../../product/messages/product/product.messages.enum';
import { Product } from '../../../../../product/models/product/product.entity';
import { ProductImageConstants } from '../../../../constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../../models/product-image/product-image.entity';
import { ProductImageService } from '../../product-image.service';

const ProductIdMessage = new UuidMessage('product id');

describe('ProductImageService.bulkSave (productId)', () => {
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

  async function getImages() {
    return productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .getMany();
  }

  describe('create', () => {
    it('should reject create image when product is not found', async () => {
      await testBuildProductImageCreationScenario(1);
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(
          'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
          imageFiles,
          { metadatas: [{ active: true, imageIdx: 0 }] },
        );
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductMessage.NOT_FOUND);
      await expect(fn).rejects.toThrow(NotFoundException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when productId id is null', async () => {
      await testBuildProductImageCreationScenario(1);
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(null, imageFiles, {
          metadatas: [{ active: true }],
        });

      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.REQUIRED);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when productId id is undefined', async () => {
      await testBuildProductImageCreationScenario(1);
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(undefined, imageFiles, {
          metadatas: [{ active: true }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.REQUIRED);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when productId is number', async () => {
      await testBuildProductImageCreationScenario(1);
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(1 as unknown as string, imageFiles, {
          metadatas: [{ active: true }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when productId is boolean', async () => {
      await testBuildProductImageCreationScenario(1);
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(true as unknown as string, imageFiles, {
          metadatas: [{ active: true }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when productId is invalid string', async () => {
      await testBuildProductImageCreationScenario(1);
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave('not-a-valid-uuid', imageFiles, {
          metadatas: [{ active: true }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when productId is array', async () => {
      await testBuildProductImageCreationScenario(1);
      const files = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave([] as unknown as string, files, {
          metadatas: [{ active: true }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when productId is object', async () => {
      await testBuildProductImageCreationScenario(1);
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave({} as unknown as string, imageFiles, {
          metadatas: [{ active: true }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });

  describe('update', () => {
    it('should reject update image when product is not found', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const fn = () =>
        productImageService.bulkSave(
          'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
          null,
          { metadatas: [{ active: true, imageId: products[0].images[0].id }] },
        );
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductMessage.NOT_FOUND);
      await expect(fn).rejects.toThrow(NotFoundException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when productId id is null', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const fn = () =>
        productImageService.bulkSave(null, null, {
          metadatas: [{ active: true, imageId: products[0].images[0].id }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.REQUIRED);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when productId id is undefined', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const fn = () =>
        productImageService.bulkSave(undefined, null, {
          metadatas: [{ active: true, imageId: products[0].images[0].id }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.REQUIRED);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when productId is number', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const fn = () =>
        productImageService.bulkSave(1 as unknown as string, null, {
          metadatas: [{ active: true, imageId: products[0].images[0].id }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when productId is boolean', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const fn = () =>
        productImageService.bulkSave(true as unknown as string, null, {
          metadatas: [{ active: true, imageId: products[0].images[0].id }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when productId is invalid string', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const fn = () =>
        productImageService.bulkSave('not-a-valid-uuid', null, {
          metadatas: [{ active: true, imageId: products[0].images[0].id }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when productId is array', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const fn = () =>
        productImageService.bulkSave([] as unknown as string, null, {
          metadatas: [{ active: true, imageId: products[0].images[0].id }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when productId is object', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const fn = () =>
        productImageService.bulkSave({} as unknown as string, null, {
          metadatas: [{ active: true, imageId: products[0].images[0].id }],
        });
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      await expect(fn).rejects.toThrow(ProductIdMessage.INVALID);
      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });
});
