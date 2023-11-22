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
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../../../../../../test/product/test-product-utils';
import { StorageMessage } from '../../../../../../../../../system/cloud-storage/messages/storage/storage.messages';
import { ImagesMetadataMessage } from '../../../../../../../../../system/decorators/images-metadata/messages/images-metadata/images-metadata.messages.enum';
import { SaveFileMetadataDto } from '../../../../../../../../../system/decorators/images-metadata/save-file-metadata.dto';
import { ExceptionText } from '../../../../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../../../../../../system/messages/uuid/uuid.messages';
import { Brand } from '../../../../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../../../../category/repositories/category.repository';
import { Product } from '../../../../../../../../product/models/product/product.entity';
import { ProductImageConfigs } from '../../../../../../../configs/product-image/product-image.configs';
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

describe('ProductImageService.bulkSave (metadata item)', () => {
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

  it('should reject when metadatas item is null', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const files = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, files, {
        metadatas: [null, {}],
      });
    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          metadatas: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadatas item is undefined', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const files = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, files, {
        metadatas: [undefined, {}],
      });
    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          metadatas: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadatas item is boolean', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const files = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, files, {
        metadatas: [true as unknown as SaveFileMetadataDto, {}],
      });
    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          metadatas: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadatas item is number', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const files = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, files, {
        metadatas: [1 as unknown as SaveFileMetadataDto, {}],
      });
    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          metadatas: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadatas item is string', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const files = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, files, {
        metadatas: ['invalid' as unknown as SaveFileMetadataDto, {}],
      });
    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          metadatas: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });

  it('should reject when metadatas item is array', async () => {
    const [productId1] = await testBuildProductImageCreationScenario(1);
    await testBuildProductImageCreationScenario(1);
    const files = await TestImages.buildFiles(1);
    const fn = () =>
      productImageService.bulkSave(productId1, files, {
        metadatas: [[] as unknown as SaveFileMetadataDto, {}],
      });
    await expect(fn).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          metadatas: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const images = await productImageRepo.find({ withDeleted: true });
    expect(images).toHaveLength(0);
  });
});