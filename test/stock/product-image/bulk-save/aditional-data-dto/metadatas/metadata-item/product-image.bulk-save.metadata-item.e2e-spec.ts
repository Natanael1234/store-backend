import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../src/.jest/test-config.module';
import { Client } from '../../../../../../../src/__mocks__/minio';
import { Brand } from '../../../../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../../../src/modules/stock/category/repositories/category.repository';
import { ProductImageConfigs } from '../../../../../../../src/modules/stock/product-image/configs/product-image/product-image.configs';
import { ProductImage } from '../../../../../../../src/modules/stock/product-image/models/product-image/product-image.entity';
import { Product } from '../../../../../../../src/modules/stock/product/models/product/product.entity';
import { StorageMessage } from '../../../../../../../src/modules/system/cloud-storage/messages/storage/storage.messages';
import { SaveMetadataItemDto } from '../../../../../../../src/modules/system/dtos/save-metadata-item/save-metadata-item.dto';
import { ExceptionText } from '../../../../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ImagesMetadataMessage } from '../../../../../../../src/modules/system/messages/images-metadata/images-metadata.messages.enum';
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
import { TestImages } from '../../../../../../../src/test/images/test-images';
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
const StorageMessages = new StorageMessage();

describe('ProductImageController (e2e) - post /product-images/:productId/images/bulk (metadata item)', () => {
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

  it('should reject when metadata item is null', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([null, {}]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata item is undefined', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([undefined, {}]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata item is boolean', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([true as unknown as SaveMetadataItemDto, {}]),
      },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata item is number', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([1 as unknown as SaveMetadataItemDto, {}]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata item is string', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      {
        metadata: JSON.stringify([
          'invalid' as unknown as SaveMetadataItemDto,
          {},
        ]),
      },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadata item is array', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify([[] as unknown as SaveMetadataItemDto, {}]) },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });
});
