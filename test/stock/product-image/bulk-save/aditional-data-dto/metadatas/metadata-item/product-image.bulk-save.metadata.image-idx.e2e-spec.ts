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
import { Product } from '../../../../../../../src/modules/stock/product/models/product/product.entity';
import { StorageMessage } from '../../../../../../../src/modules/system/cloud-storage/messages/storage/storage.messages';
import { SortConstants } from '../../../../../../../src/modules/system/constants/sort/sort.constants';
import { SaveMetadataItemDto } from '../../../../../../../src/modules/system/dtos/save-metadata-item/save-metadata-item.dto';
import { ExceptionText } from '../../../../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ImagesMetadataMessage } from '../../../../../../../src/modules/system/messages/images-metadata/images-metadata.messages.enum';
import { NumberMessage } from '../../../../../../../src/modules/system/messages/number/number.messages';
import { TextMessage } from '../../../../../../../src/modules/system/messages/text/text.messages';
import { UuidMessage } from '../../../../../../../src/modules/system/messages/uuid/uuid.messages';
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

const ProductIdMessage = new UuidMessage('product id');
const NameTextMessage = new TextMessage('name', {
  maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
});
const DescriptionTextMessage = new TextMessage('description', {
  maxLength: ProductImageConfigs.DESCRIPTION_MAX_LENGTH,
});
const FileIdxMessage = new NumberMessage('file index', { min: 0 });
const ImageIdMessage = new UuidMessage('image id');
const StorageMessages = new StorageMessage();

describe('ProductImageController (e2e) - post /product-images/:productId/images/bulk (metadata.fileIdx)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;

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

  it('should accept to create maximum allowed images per product', async () => {
    const numFiles = ProductImageConfigs.MAX_IMAGE_COUNT + 1;
    const [productId1, productId2] =
      await testBuildProductImageCreationScenario(2);
    const [file] = await TestImages.buildFiles(1);

    const metadata1: SaveMetadataItemDto[] = [];
    const files1 = [];
    function getNumStr(idx: number) {
      return idx + 1 < 10 ? '0' + (idx + 1) : idx + 1;
    }
    for (let i = 0; i < numFiles - 1; i++) {
      metadata1.push({
        name: `First product image #${getNumStr(i)}`,
        main: i == 0,
        active: true,
        fileIdx: i,
      });
      files1.push({
        field: 'files',
        buffer: file.buffer,
        filepath: file.originalname,
      });
    }
    const metadata2: SaveMetadataItemDto[] = [
      {
        name: `Second product image #${getNumStr(0)}`,
        main: true,
        active: true,
        fileIdx: 0,
      },
    ];
    const files2 = [
      { field: 'files', buffer: file.buffer, filepath: file.originalname },
    ];

    const product1ImagesRet = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify(metadata1) },
      files1,
      rootToken,
      HttpStatus.CREATED,
    );

    const product2ImagesRet = await testUploadMin(
      app,
      '/product-images/' + productId2 + '/images/bulk',
      { metadata: JSON.stringify(metadata2) },
      files2,
      rootToken,
      HttpStatus.CREATED,
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
        path: `/public/products/${productId1}/images/${product1ImagesRet[1].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[1].id}.thumbnail.jpeg`,
        size: 2709,
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
        path: `/public/products/${productId1}/images/${product1ImagesRet[3].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[3].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[4].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[4].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[5].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[5].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[6].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[6].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[7].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[7].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[8].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[8].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[9].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[9].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[10].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[10].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[11].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId1}/images/${product1ImagesRet[11].id}.thumbnail.jpeg`,
        size: 2709,
      },
      {
        path: `/public/products/${productId2}/images/${product2ImagesRet[0].id}.jpg`,
        size: 5921,
      },
      {
        path: `/public/products/${productId2}/images/${product2ImagesRet[0].id}.thumbnail.jpeg`,
        size: 2709,
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
    const expectedImagesProduct1 = metadata1.map((metadata, idx) => {
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
    const expectedImagesProduct2 = metadata2.map((metadata, idx) => {
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
    const [file] = await TestImages.buildFiles(1);
    const metadata: SaveMetadataItemDto[] = [];
    const files = [];
    for (let i = 0; i < ProductImageConfigs.MAX_IMAGE_COUNT + 1; i++) {
      metadata.push({
        name: `Image ${i + 1}`,
        description: `Description ${i + 1}`,
        fileIdx: i,
      });
      files.push({
        field: 'files',
        buffer: file.buffer,
        filepath: file.originalname,
      });
    }
    const imagesBefore = await productImageRepo.find();

    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify(metadata) },
      files,
      rootToken,
      HttpStatus.BAD_REQUEST,
    );
    // TODO: move to constants
    const expectedMessage = `Maximum number of images reached. A product can have a maximum of ${ProductImageConfigs.MAX_IMAGE_COUNT} images`;

    const imagesAfter = await productImageRepo.find();
    expect(imagesBefore).toStrictEqual(imagesAfter);
    expect(response).toEqual({
      error: ExceptionText.BAD_REQUEST,
      message: expectedMessage,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('should reject when metadata.fileIdx references a inexistent image index in imageFiles', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([{ active: true, fileIdx: 1 }]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY,
      message: ImagesMetadataMessage.FILE_IDX_NOT_FOUND,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata contains multiple items with the same fileIdx', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file1] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          { active: true, fileIdx: 0 },
          { active: true, fileIdx: 0 },
        ]),
      },
      [{ field: 'files', buffer: file1.buffer, filepath: file1.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImagesMetadataMessage.FILE_IDX_DUPLICATED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });

    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.fileIdx is negative number', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([{ active: true, fileIdx: -1 }]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: FileIdxMessage.MIN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.fileIdx is boolean', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([{ active: true, fileIdx: true }]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: FileIdxMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.fileIdx is string', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([{ active: true, fileIdx: '1' }]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: FileIdxMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.fileIdx is array', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([{ active: true, fileIdx: [] }]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: FileIdxMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata.fileIdx is object', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([{ active: true, fileIdx: {} }]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: FileIdxMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });
});
