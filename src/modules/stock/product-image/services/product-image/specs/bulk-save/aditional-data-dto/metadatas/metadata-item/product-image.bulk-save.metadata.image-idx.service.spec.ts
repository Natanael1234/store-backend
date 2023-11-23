import {
  BadRequestException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
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
import { StorageMessage } from '../../../../../../../../../system/cloud-storage/messages/storage/storage.messages';
import { SortConstants } from '../../../../../../../../../system/constants/sort/sort.constants';
import { ImagesMetadataMessage } from '../../../../../../../../../system/decorators/images-metadata/messages/images-metadata/images-metadata.messages.enum';
import { SaveFileMetadataDto } from '../../../../../../../../../system/decorators/images-metadata/save-file-metadata.dto';
import { ExceptionText } from '../../../../../../../../../system/messages/exception-text/exception-text.enum';
import { ImageMessage } from '../../../../../../../../../system/messages/image/image.messages.enum';
import { TextMessage } from '../../../../../../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../../../../../../system/messages/uuid/uuid.messages';
import { Brand } from '../../../../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../../../../category/repositories/category.repository';
import { Product } from '../../../../../../../../product/models/product/product.entity';
import { ProductImageConfigs } from '../../../../../../../configs/product-image/product-image.configs';
import { ProductImageConstants } from '../../../../../../../constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../../../../../models/product-image/product-image.entity';
import { ProductImageService } from '../../../../../product-image.service';

const ProductIdMessage = new UuidMessage('product id');
const NameTextMessage = new TextMessage('name', {
  maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
});
const DescriptionTextMessage = new TextMessage('description', {
  maxLength: ProductImageConfigs.DESCRIPTION_MAX_LENGTH,
});

const StorageMessages = new StorageMessage();

describe('ProductImageService.bulkSave (metadata.imageIdx)', () => {
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

  it('should accept to create maximum allowed images per product', async () => {
    const [productId1, productId2] =
      await testBuildProductImageCreationScenario(2);
    const imageFiles = await TestImages.buildFiles(
      ProductImageConfigs.MAX_IMAGE_COUNT + 1,
    );

    const imageFiles1 = imageFiles.slice(0, imageFiles.length - 1);
    const imageFiles2 = imageFiles.slice(imageFiles.length - 1);

    const metadatas1: SaveFileMetadataDto[] = [];
    function getNumStr(idx: number) {
      return idx + 1 < 10 ? '0' + (idx + 1) : idx + 1;
    }
    for (let i = 0; i < imageFiles1.length; i++) {
      metadatas1.push({
        name: `First product image #${getNumStr(i)}`,
        main: i == 0,
        active: true,
        imageIdx: i,
      });
    }
    const metadatas2: SaveFileMetadataDto[] = [];
    for (let i = 0; i < imageFiles2.length; i++) {
      metadatas2.push({
        name: `Second product image #${getNumStr(i)}`,
        main: i == 0,
        active: true,
        imageIdx: i,
      });
    }

    const product1ImagesRet = await productImageService.bulkSave(
      productId1,
      imageFiles1,
      { metadatas: metadatas1 },
    );

    const product2ImagesRet = await productImageService.bulkSave(
      productId2,
      imageFiles2,
      { metadatas: metadatas2 },
    );

    expect(product1ImagesRet).toBeDefined();
    expect(product2ImagesRet).toBeDefined();

    // images in the cloud storage
    expect(Client._getBucketsSnapshot()).toBeDefined();
    const bucket = Client._getBucketSnapshot('test-store-bucket');
    expect(bucket).toBeDefined();
    expect(bucket).toHaveLength(26);
    const savedFilenames = [...new Set(bucket.map((item) => item.name))];
    expect(savedFilenames).toHaveLength(bucket.length);

    const expectedBucketItems = [
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[0].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[0].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[1].id}.png`,
        size: 191777,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[1].id}.thumbnail.jpeg`,
        size: 5215,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[2].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[2].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[3].id}.png`,
        size: 191777,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[3].id}.thumbnail.jpeg`,
        size: 5215,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[4].id}.png`,
        size: 191777,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[4].id}.thumbnail.jpeg`,
        size: 5215,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[5].id}.png`,
        size: 1278655,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[5].id}.thumbnail.jpeg`,
        size: 3832,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[6].id}.png`,
        size: 921651,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[6].id}.thumbnail.jpeg`,
        size: 8288,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[7].id}.png`,
        size: 1250043,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[7].id}.thumbnail.jpeg`,
        size: 3862,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[8].id}.png`,
        size: 1417928,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[8].id}.thumbnail.jpeg`,
        size: 4342,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[9].id}.png`,
        size: 1320714,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[9].id}.thumbnail.jpeg`,
        size: 4210,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[10].id}.png`,
        size: 1161635,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[10].id}.thumbnail.jpeg`,
        size: 5551,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[11].id}.png`,
        size: 1455204,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[11].id}.thumbnail.jpeg`,
        size: 6204,
      },
      {
        path: `/public/products/${productId2}/images/${product2ImagesRet[0].id}.png`,
        size: 1344081,
      },
      {
        path: `/public/products/${productId2}/images/${product2ImagesRet[0].id}.thumbnail.jpeg`,
        size: 6582,
      },
    ];

    testValidateBuckedItems(expectedBucketItems, bucket);

    const imagesProduct1 = await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .where(ProductImageConstants.PRODUCT_IMAGE_PRODUCT_ID_EQUALS_TO, {
        productId: productId1,
      })
      .getMany();
    const imagesProduct2 = await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .where(ProductImageConstants.PRODUCT_IMAGE_PRODUCT_ID_EQUALS_TO, {
        productId: productId2,
      })
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .getMany();

    let bucketIdx = 0;
    const expectedImagesProduct1 = metadatas1.map((metadata, idx) => {
      return {
        name: `First product image #${getNumStr(idx)}`,
        description: null,
        image: bucket[bucketIdx++].name,
        thumbnail: bucket[bucketIdx++].name,
        main: idx == 0,
        active: true,
        productId: productId1,
      };
    });
    const expectedImagesProduct2 = metadatas2.map((metadata, idx) => {
      return {
        name: `Second product image #${getNumStr(idx)}`,
        description: null,
        image: bucket[bucketIdx++].name,
        thumbnail: bucket[bucketIdx++].name,
        main: idx == 0,
        active: true,
        productId: productId2,
      };
    });

    // reorder items to match name sort order
    testValidateProductImages(imagesProduct1, expectedImagesProduct1);
    testValidateProductImages(imagesProduct2, expectedImagesProduct2);
  });

  it('should reject when creating more images than allowed', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imageFiles = await TestImages.buildFiles(
      ProductImageConfigs.MAX_IMAGE_COUNT + 1,
    );
    const metadatas: SaveFileMetadataDto[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      metadatas.push({
        name: `Image ${i + 1}`,
        description: `Description ${i + 1}`,
        imageIdx: i,
      });
    }
    const imagesBefore = await productImageRepo.find();
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas,
      });
    // TODO: move to constants
    const expectedMessage = `Maximum number of images reached. A product can have a maximum of ${ProductImageConfigs.MAX_IMAGE_COUNT} images`;
    await expect(fn()).rejects.toThrow(BadRequestException);
    const imagesAfter = await productImageRepo.find();
    expect(imagesBefore).toStrictEqual(imagesAfter);
    await expect(fn()).rejects.toThrow(expectedMessage);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.BAD_REQUEST,
        message: expectedMessage,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  });

  it('should reject when metadata.imageIdx references a image in imageFiles but imageFiles is null', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const fn = () =>
      productImageService.bulkSave(productId1, null, {
        metadatas: [{ active: true, imageIdx: 0 }],
      });
    await expect(fn).rejects.toThrow(ImageMessage.IMAGES_NOT_DEFINED);
    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.imageIdx references a image in imageFiles but imageFiles is undefined', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const fn = () =>
      productImageService.bulkSave(productId1, undefined, {
        metadatas: [{ active: true, imageIdx: 0 }],
      });
    await expect(fn).rejects.toThrow(ImageMessage.IMAGES_NOT_DEFINED);
    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.imageIdx references a inexistent image index in imageFiles', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, [file], {
        metadatas: [{ active: true, imageIdx: 1 }],
      });
    await expect(fn).rejects.toThrow(ImagesMetadataMessage.IMAGE_IDX_NOT_FOUND);
    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadatas contains multiple items with the same imageIdx', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imageFiles = await TestImages.buildFiles(2);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [
          { active: true, imageIdx: 1 },
          { active: true, imageIdx: 1 },
        ],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.IMAGE_IDX_DUPLICATED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }

    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.imageIdx is negative number', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ active: true, imageIdx: -1 }],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.IMAGE_IDX_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.imageIdx is boolean', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ active: true, imageIdx: true as unknown as number }],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.IMAGE_IDX_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.imageIdx is string', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ active: true, imageIdx: '1' as unknown as number }],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.IMAGE_IDX_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.imageIdx is array', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ active: true, imageIdx: [] as unknown as number }],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.IMAGE_IDX_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.imageIdx is object', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const imageFiles = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, imageFiles, {
        metadatas: [{ active: true, imageIdx: {} as unknown as number }],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { metadatas: ImagesMetadataMessage.IMAGE_IDX_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });
});
