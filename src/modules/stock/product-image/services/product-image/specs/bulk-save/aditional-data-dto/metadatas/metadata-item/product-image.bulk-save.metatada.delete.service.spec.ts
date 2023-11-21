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

describe('ProductImageService.bulkSave (metadata.delete)', () => {
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
    const ret1_2 = await productImageService.bulkSave(
      productId1,
      imageFiles.slice(0, 2),
      {
        metadatas: [
          { name: 'Image 1', active: false, imageIdx: 0 },
          { name: 'Image 2', active: true, imageIdx: 1 },
        ],
      },
    );
    const ret3 = await productImageService.bulkSave(
      productId2,
      imageFiles.slice(2),
      { metadatas: [{ name: 'Image 3', active: true, imageIdx: 0 }] },
    );

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
    it('should accept create image when metadata.delete is true and metadata.imageIdx is defined', async () => {
      const products = await createDeletionTestScenario();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const ret = await productImageService.bulkSave(
        products[0].id,
        imageFiles,
        { metadatas: [{ name: 'Image 4', delete: true, imageIdx: 0 }] },
      );
      const expectedResults = [
        products[0].images[0],
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(ret, expectedResults.slice(0, 2));
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

      // expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore); // TODO: remove from bucket
    });

    it('should reject create image when metadata.delete is null', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(products[0].id, imageFiles, {
          metadatas: [{ imageIdx: 0, delete: null }],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_NULL },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.delete is number', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(products[0].id, imageFiles, {
          metadatas: [{ imageIdx: 0, delete: 1 as unknown as boolean }],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_INVALID },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.delete is string', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(products[0].id, imageFiles, {
          metadatas: [{ imageIdx: 0, delete: 'true' as unknown as boolean }],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_INVALID },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.delete is array', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(products[0].id, imageFiles, {
          metadatas: [{ imageIdx: 0, delete: [] as unknown as boolean }],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_INVALID },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when metadata.delete is object', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const imageFiles = await TestImages.buildFiles(1);
      const fn = () =>
        productImageService.bulkSave(products[0].id, imageFiles, {
          metadatas: [{ imageIdx: 0, delete: {} as unknown as boolean }],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_INVALID },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });

  describe('update', () => {
    it('should accept update image when metadata.delete is true and metadata.imageId is defined', async () => {
      const products = await createDeletionTestScenario();
      const bucketsBefore = Client._getBucketsSnapshot();

      const ret = await productImageService.bulkSave(products[0].id, null, {
        metadatas: [{ delete: true, imageId: products[0].images[0].id }],
      });

      const expectedResults = [
        { ...products[0].images[0], deleted: true },
        products[0].images[1],
        products[1].images[0],
      ];
      testValidateProductImages(ret, expectedResults.slice(1, 2));
      const images = await getImages();
      testValidateProductImages(images, expectedResults);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore); // TODO: remove from bucket
    });

    it('should reject update image when metadata.delete is null', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const fn = () =>
        productImageService.bulkSave(products[0].id, null, {
          metadatas: [{ imageId: products[0].images[0].id, delete: null }],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_NULL },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.delete is number', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const fn = () =>
        productImageService.bulkSave(products[0].id, null, {
          metadatas: [
            {
              imageId: products[0].images[0].id,
              delete: 1 as unknown as boolean,
            },
          ],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_INVALID },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.delete is string', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const fn = () =>
        productImageService.bulkSave(products[0].id, null, {
          metadatas: [
            {
              imageId: products[0].images[0].id,
              delete: 'true' as unknown as boolean,
            },
          ],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_INVALID },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.delete is array', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const fn = () =>
        productImageService.bulkSave(products[0].id, null, {
          metadatas: [
            {
              imageId: products[0].images[0].id,
              delete: [] as unknown as boolean,
            },
          ],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_INVALID },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when metadata.delete is object', async () => {
      const products = await createDeletionTestScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const fn = () =>
        productImageService.bulkSave(products[0].id, null, {
          metadatas: [
            {
              imageId: products[0].images[0].id,
              delete: {} as unknown as boolean,
            },
          ],
        });

      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
          message: { metadatas: ImagesMetadataMessage.DELETE_IS_INVALID },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });

  it.skip('should allow to save metadatas when the difference in quantidy between created and deleted is allowed', async () => {});
});
