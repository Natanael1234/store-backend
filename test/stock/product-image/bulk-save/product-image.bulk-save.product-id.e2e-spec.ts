import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Client } from '../../../../src/__mocks__/minio';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductImageConstants } from '../../../../src/modules/stock/product-image/constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../../../src/modules/stock/product-image/models/product-image/product-image.entity';
import { ProductImageService } from '../../../../src/modules/stock/product-image/services/product-image/product-image.service';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { ProductMessage } from '../../../../src/modules/stock/product/messages/product/product.messages.enum';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../src/test/category/test-category-utils';
import { TestImages } from '../../../../src/test/images/test-images';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testUploadMin,
} from '../../../utils/test-end-to-end.utils';

const ProductIdMessage = new UuidMessage('product id');

describe('ProductImageController (e2e) - post /product-images/:productId/images/bulk (productId)', () => {
  let productImageService: ProductImageService;
  let module: TestingModule;
  let app: INestApplication;
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
    productImageService = module.get<ProductImageService>(ProductImageService);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
    Client.reset();
  });

  afterEach(async () => {
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
      {
        name: 'Image 1',
        main: true,
        active: false,
        file: file1,
      },
      {
        name: 'Image 2',
        main: false,
        active: true,
        file: file2,
      },
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
    it('should reject create image when product is not found', async () => {
      await testBuildProductImageCreationScenario(1);
      const [file] = await TestImages.buildFiles(1);
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/f136f640-90b7-11ed-a2a0-fd911f8f7f38/images/bulk',
        { metadata: JSON.stringify([{ fileIdx: 0 }]) },
        [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
        rootToken,
        HttpStatus.NOT_FOUND,
      );
      expect(response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: ProductMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject create image when productId is invalid string', async () => {
      await testBuildProductImageCreationScenario(1);
      const [file] = await TestImages.buildFiles(1);
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/not-a-valid-uuid/images/bulk',
        { metadata: JSON.stringify([{ fileIdx: 0 }]) },
        [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
        rootToken,
        HttpStatus.BAD_REQUEST,
      );
      expect(response).toEqual({
        error: ExceptionText.BAD_REQUEST,
        message: ProductIdMessage.INVALID,
        statusCode: HttpStatus.BAD_REQUEST,
      });

      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });

  describe('update', () => {
    it('should reject update image when product is not found', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/f136f640-90b7-11ed-a2a0-fd911f8f7f38/images/bulk',
        {
          metadata: JSON.stringify([
            { active: true, imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.NOT_FOUND,
      );
      expect(response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: ProductMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });

    it('should reject update image when productId is invalid string', async () => {
      const products = await testBuildProductImageUpdateScenario();
      const imagesBefore = await getImages();
      const bucketsBefore = Client._getBucketsSnapshot();
      const response = await testUploadMin(
        app,
        '/product-images/not-a-valid-uuid/images/bulk',
        {
          metadata: JSON.stringify([
            { active: true, imageId: products[0].images[0].id },
          ]),
        },
        [],
        rootToken,
        HttpStatus.BAD_REQUEST,
      );
      expect(response).toEqual({
        error: ExceptionText.BAD_REQUEST,
        message: ProductIdMessage.INVALID,
        statusCode: HttpStatus.BAD_REQUEST,
      });
      const imagesAfter = await getImages();
      expect(imagesBefore).toEqual(imagesAfter);
      expect(Client._getBucketsSnapshot()).toEqual(bucketsBefore);
    });
  });
});
