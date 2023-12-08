import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
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
import { ImageMessage } from '../../../../../system/messages/image/image.messages.enum';
import { UuidMessage } from '../../../../../system/messages/uuid/uuid.messages';
import { Brand } from '../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../category/repositories/category.repository';
import { ProductConstants } from '../../../../product/constants/product/product-entity.constants';
import { Product } from '../../../../product/models/product/product.entity';
import { ProductImageConfigs } from '../../../configs/product-image/product-image.configs';
import { ProductImageConstants } from '../../../constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../models/product-image/product-image.entity';
import { ProductImageService } from '../product-image.service';

describe('ProductImageService.bulkSave (metadata.imageId)', () => {
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

  it('should accept update one image of a product', async () => {
    const products = await testBuildProductImageUpdateScenario();
    const response = await productImageService.bulkSave(products[0].id, [
      {
        imageId: products[0].images[0].id,
        main: !!products[0].images[0].main,
        active: !!products[0].images[0].active,
        name: 'Image 1 b',
        description: 'Description 1 b',
      },
    ]);
    const images = await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .getMany();
    testValidateProductImages(response, [
      {
        ...products[0].images[0],
        name: 'Image 1 b',
        description: 'Description 1 b',
      },
      products[0].images[1],
    ]);
    testValidateProductImages(images, [
      {
        ...products[0].images[0],
        name: 'Image 1 b',
        description: 'Description 1 b',
      },
      products[0].images[1],
      products[1].images[0],
    ]);
  });

  it('should accept update two images of a product', async () => {
    const products = await testBuildProductImageUpdateScenario();
    const ret = await productImageService.bulkSave(products[0].id, [
      {
        imageId: products[0].images[0].id,
        main: !!products[0].images[0].main,
        active: !!products[0].images[0].active,
        name: 'Image 1 b',
        description: 'Description 1 b',
      },
      {
        imageId: products[0].images[1].id,
        main: !!products[0].images[1].main,
        active: !!products[0].images[1].active,
        name: 'Image 2 b',
        description: 'Description 2 b',
      },
    ]);
    const images = await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE) //  TODO: extract to constants
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .getMany();
    testValidateProductImages(ret, [
      {
        ...products[0].images[0],
        name: 'Image 1 b',
        description: 'Description 1 b',
      },
      {
        ...products[0].images[1],
        name: 'Image 2 b',
        description: 'Description 2 b',
      },
    ]);
    testValidateProductImages(images, [
      {
        ...products[0].images[0],
        name: 'Image 1 b',
        description: 'Description 1 b',
      },
      {
        ...products[0].images[1],
        name: 'Image 2 b',
        description: 'Description 2 b',
      },
      products[1].images[0],
    ]);
  });

  it('should accept update metadata.imageId when metadata.file is null', async () => {
    const [product1, product2] = await testBuildProductImageUpdateScenario();
    const ret3 = await productImageService.bulkSave(product1.id, [
      { name: 'Image 1 b', imageId: product1.images[0].id, file: null },
    ]);
    // images in the cloud storage
    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    expect(bucket).toBeDefined();
    expect(bucket).toHaveLength(6);
    const savedFilenames = [...new Set(bucket.map((item) => item.name))];
    expect(savedFilenames).toHaveLength(bucket.length);

    const images = await getImages();
    testValidateBuckedItems(
      [
        // image 1
        {
          path: `/private/products/${product1.id}/images/${images[0].id}.jpg`,
          size: 5921,
        },
        {
          path: `/private/products/${product1.id}/images/${images[0].id}.thumbnail.jpeg`,
          size: 2709,
        },
        // image 2
        {
          path: `/public/products/${product1.id}/images/${images[1].id}.png`,
          size: 191777,
        },
        {
          path: `/public/products/${product1.id}/images/${images[1].id}.thumbnail.jpeg`,
          size: 5215,
        },
        // image 3
        {
          path: `/public/products/${product2.id}/images/${images[2].id}.jpg`,
          size: 5921,
        },
        {
          path: `/public/products/${product2.id}/images/${images[2].id}.thumbnail.jpeg`,
          size: 2709,
        },
      ],
      bucket,
    );

    // reorder items to match name sort order
    testValidateProductImages(images, [
      // fist created
      {
        name: 'Image 1 b',
        description: null,
        image: bucket[0].name,
        thumbnail: bucket[1].name,
        main: true,
        active: false,
        productId: product1.id,
      },
      // second created
      {
        name: 'Image 2',
        description: null,
        image: bucket[2].name,
        thumbnail: bucket[3].name,
        main: false,
        active: true,
        productId: product1.id,
      },
      // third created
      {
        name: 'Image 3',
        description: null,
        image: bucket[4].name,
        thumbnail: bucket[5].name,
        main: false,
        active: true,
        productId: product2.id,
      },
    ]);
  });

  it('should accept update metadata.imageId when file is metadata.undefined', async () => {
    const [product1, product2] = await testBuildProductImageUpdateScenario();
    const ret3 = await productImageService.bulkSave(product1.id, [
      { name: 'Image 1 b', imageId: product1.images[0].id, file: undefined },
    ]);
    // images in the cloud storage
    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    expect(bucket).toBeDefined();
    expect(bucket).toHaveLength(6);
    const savedFilenames = [...new Set(bucket.map((item) => item.name))];
    expect(savedFilenames).toHaveLength(bucket.length);
    const images = await getImages();
    testValidateBuckedItems(
      [
        // image 1
        {
          path: `/private/products/${product1.id}/images/${images[0].id}.jpg`,
          size: 5921,
        },
        {
          path: `/private/products/${product1.id}/images/${images[0].id}.thumbnail.jpeg`,
          size: 2709,
        },
        // image 2
        {
          path: `/public/products/${product1.id}/images/${images[1].id}.png`,
          size: 191777,
        },
        {
          path: `/public/products/${product1.id}/images/${images[1].id}.thumbnail.jpeg`,
          size: 5215,
        },
        // image 3
        {
          path: `/public/products/${product2.id}/images/${images[2].id}.jpg`,
          size: 5921,
        },
        {
          path: `/public/products/${product2.id}/images/${images[2].id}.thumbnail.jpeg`,
          size: 2709,
        },
      ],
      bucket,
    );

    // reorder items to match name sort order
    testValidateProductImages(images, [
      // fist created
      {
        name: 'Image 1 b',
        description: null,
        image: bucket[0].name,
        thumbnail: bucket[1].name,
        main: true,
        active: false,
        productId: product1.id,
      },
      // second created
      {
        name: 'Image 2',
        description: null,
        image: bucket[2].name,
        thumbnail: bucket[3].name,
        main: false,
        active: true,
        productId: product1.id,
      },
      // third created
      {
        name: 'Image 3',
        description: null,
        image: bucket[4].name,
        thumbnail: bucket[5].name,
        main: false,
        active: true,
        productId: product2.id,
      },
    ]);
  });

  it('should accept update maximum allowed metadata items', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const [productId1] = await insertProducts({
      code: '00000001',
      name: 'Product 1',
      model: 'Model 1',
      price: 50,
      quantityInStock: 5,
      active: true,
      brandId: brandId1,
      categoryId: categoryId1,
    });
    const imageFiles = await TestImages.buildFiles(
      ProductImageConfigs.MAX_IMAGE_COUNT,
    );
    const metadataFrCreation = imageFiles.map((imageFile, idx) => {
      const imageNumber = idx + 1;
      const name =
        imageNumber < 10 ? `Image 0${imageNumber}` : `Image ${imageNumber}`;
      return {
        main: idx == 0,
        active: true,
        name,
        file: imageFile,
      };
    });
    const retCreate = await productImageService.bulkSave(
      productId1,
      metadataFrCreation,
    );
    const buckets = Client._getBucketsSnapshot();
    const metadataForUpdate = metadataFrCreation.map((metadata, fileIdx) => {
      return { imageId: retCreate[fileIdx].id, name: metadata.name + ' b' };
    });
    const imagesBefore = await getImages();

    const retUpdate = await productImageService.bulkSave(
      productId1,
      metadataForUpdate,
    );

    const expectedResults = imagesBefore.map((productImage) => {
      return { ...productImage, name: productImage.name + ' b' };
    });
    testValidateProductImages(retUpdate, expectedResults);
    const imagesAfter = await getImages();
    testValidateProductImages(imagesAfter, expectedResults);
    expect(buckets).toEqual(Client._getBucketsSnapshot());
  });

  it.skip('should reject when updating more images than allowed', async () => {});

  it.skip('should reject when updating and creating more images than allowed', async () => {});

  it('should reject when metadata.imageId is boolean', async () => {
    const ImageIdMessage = new UuidMessage('image id');
    const [product] = await testBuildProductImageUpdateScenario();
    const fn = () =>
      productImageService.bulkSave(product.id, [
        { active: true, imageId: true as unknown as string },
      ]);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImageIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata.imageId is invalid string', async () => {
    const ImageIdMessage = new UuidMessage('image id');
    const [product] = await testBuildProductImageUpdateScenario();
    const fn = () =>
      productImageService.bulkSave(product.id, [
        { active: true, imageId: 'not-a-valid-uuid' },
      ]);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImageIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata.imageId is array', async () => {
    const [product] = await testBuildProductImageUpdateScenario();
    const fn = () =>
      productImageService.bulkSave(product.id, [
        { active: true, imageId: [] as unknown as string },
      ]);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImageMessage.IMAGE_ID_INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata.imageId is object', async () => {
    const [product] = await testBuildProductImageUpdateScenario();
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(product.id, [
        { active: true, imageId: {} as unknown as string },
      ]);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImageMessage.IMAGE_ID_INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata.imageId references a inexistent image', async () => {
    const [product] = await testBuildProductImageUpdateScenario();
    const [file1] = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(product.id, [
        { active: true, imageId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38' },
      ]);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    await expect(fn).rejects.toThrow(ImageMessage.IMAGE_NOT_FOUND);
    await expect(fn).rejects.toThrow(NotFoundException);
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata.imageId from a different product', async () => {
    const products = await testBuildProductImageUpdateScenario();
    const imagesBefore = await productImageRepo.find();
    const fn = () =>
      productImageService.bulkSave(products[1].id, [
        {
          imageId: products[0].images[0].id,
          main: !!products[0].images[0].main,
          active: !!products[0].images[0].active,
          name: 'New name 1',
          description: 'New description 1',
        },
      ]);
    await expect(fn()).rejects.toThrow(NotFoundException);
    const imagesAfter = await productImageRepo.find();
    await expect(fn()).rejects.toThrow(ImageMessage.IMAGE_NOT_FOUND);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: ImageMessage.IMAGE_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    expect(imagesBefore).toStrictEqual(imagesAfter);
  });

  it('should reject when metadata cointains multiple items with the same imageId', async () => {
    const products = await testBuildProductImageUpdateScenario();
    const imagesBefore = await productImageRepo.find();
    const fn = () =>
      productImageService.bulkSave(products[0].id, [
        { imageId: products[0].images[0].id },
        { imageId: products[0].images[0].id },
      ]);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: ImageMessage.IMAGE_ID_DUPLICATED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const imagesAfter = await productImageRepo.find();
    expect(imagesBefore).toStrictEqual(imagesAfter);
  });
});
