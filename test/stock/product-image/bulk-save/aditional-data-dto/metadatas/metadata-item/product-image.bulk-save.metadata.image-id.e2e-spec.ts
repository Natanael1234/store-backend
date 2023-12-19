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
import { ProductImageService } from '../../../../../../../src/modules/stock/product-image/services/product-image/product-image.service';
import { ProductConstants } from '../../../../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { Product } from '../../../../../../../src/modules/stock/product/models/product/product.entity';
import { SortConstants } from '../../../../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ImageMessage } from '../../../../../../../src/modules/system/messages/image/image.messages.enum';
import { ImagesMetadataMessage } from '../../../../../../../src/modules/system/messages/images-metadata/images-metadata.messages.enum';
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
import { testValidateProductImages } from '../../../../../../../src/test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testUploadMin,
} from '../../../../../../utils/test-end-to-end.utils';

const ImageIdMessage = new UuidMessage('image id');

describe('ProductImageController (e2e) - post /product-images/:productId/images/bulk (metadata.imageId)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;
  let productImageService: ProductImageService;

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
    await app.close();
    await module.close(); // TODO: é necessário?
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
    const response = await testUploadMin(
      app,
      '/product-images/' + products[0].id + '/images/bulk',
      {
        metadata: JSON.stringify([
          {
            imageId: products[0].images[0].id,
            main: !!products[0].images[0].main,
            active: !!products[0].images[0].active,
            name: 'Image 1 b',
            description: 'Description 1 b',
          },
        ]),
      },
      [],
      rootToken,
      HttpStatus.CREATED,
    );
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
    const response = await testUploadMin(
      app,
      '/product-images/' + products[0].id + '/images/bulk',
      {
        metadata: JSON.stringify([
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
        ]),
      },
      [],
      rootToken,
      HttpStatus.CREATED,
    );
    const images = await productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE) //  TODO: extract to constants
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .getMany();
    testValidateProductImages(response, [
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
    const [file] = await TestImages.buildFiles(1);
    const metadataList = [];
    const files = [];
    for (
      let fileIdx = 0;
      fileIdx < ProductImageConfigs.MAX_IMAGE_COUNT;
      fileIdx++
    ) {
      const imageNumber = fileIdx + 1;
      const name =
        imageNumber < 10 ? `Image 0${imageNumber}` : `Image ${imageNumber}`;
      const metadataItem = { fileIdx, main: fileIdx == 0, active: true, name };
      metadataList.push(metadataItem);
      files.push({
        field: 'files',
        buffer: file.buffer,
        filepath: file.originalname,
      });
    }

    const responseCreate = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify(metadataList) },
      files,
      rootToken,
      HttpStatus.CREATED,
    );
    const buckets = Client._getBucketsSnapshot();
    const metadataForUpdate = metadataList.map((metadata, fileIdx) => {
      return {
        imageId: responseCreate[fileIdx].id,
        name: metadata.name + ' b',
      };
    });
    const imagesBefore = await getImages();

    const responseUpdate = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: JSON.stringify(metadataForUpdate) },
      [],
      rootToken,
      HttpStatus.CREATED,
    );

    const expectedResults = imagesBefore.map((productImage) => {
      return { ...productImage, name: productImage.name + ' b' };
    });
    testValidateProductImages(responseUpdate, expectedResults);
    const imagesAfter = await getImages();
    testValidateProductImages(imagesAfter, expectedResults);
    expect(buckets).toEqual(Client._getBucketsSnapshot());
  });

  it.skip('should reject when updating more images than allowed', async () => {});

  it.skip('should reject when updating and creating more iumages than allowed', async () => {});

  it('should reject when metadata.imageId is boolean', async () => {
    const [product] = await testBuildProductImageUpdateScenario();
    const imageFiles = await TestImages.buildFiles(1);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    const response = await testUploadMin(
      app,
      '/product-images/' + product.id + '/images/bulk',
      { metadata: JSON.stringify([{ active: true, imageId: true }]) },
      [
        {
          field: 'files',
          buffer: imageFiles[0].buffer,
          filepath: imageFiles[0].originalname,
        },
      ],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImageIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata.imageId is invalid string', async () => {
    const [product] = await testBuildProductImageUpdateScenario();
    const imageFiles = await TestImages.buildFiles(1);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    const response = await testUploadMin(
      app,
      '/product-images/' + product.id + '/images/bulk',
      {
        metadata: JSON.stringify([
          { active: true, imageId: 'not-a-valid-uuid' },
        ]),
      },
      [
        {
          field: 'files',
          buffer: imageFiles[0].buffer,
          filepath: imageFiles[0].originalname,
        },
      ],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImageIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata.imageId is array', async () => {
    const [product] = await testBuildProductImageUpdateScenario();
    const imageFiles = await TestImages.buildFiles(1);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    const response = await testUploadMin(
      app,
      '/product-images/' + product.id + '/images/bulk',
      { metadata: JSON.stringify([{ active: true, imageId: [] }]) },
      [
        {
          field: 'files',
          buffer: imageFiles[0].buffer,
          filepath: imageFiles[0].originalname,
        },
      ],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImageIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata.imageId is object', async () => {
    const [product] = await testBuildProductImageUpdateScenario();
    const imageFiles = await TestImages.buildFiles(1);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    const response = await testUploadMin(
      app,
      '/product-images/' + product.id + '/images/bulk',
      { metadata: JSON.stringify([{ active: true, imageId: [] }]) },
      [
        {
          field: 'files',
          buffer: imageFiles[0].buffer,
          filepath: imageFiles[0].originalname,
        },
      ],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImageIdMessage.STRING },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata.imageId references a inexistent image', async () => {
    const [product] = await testBuildProductImageUpdateScenario();
    const [file] = await TestImages.buildFiles(1);
    const imagesBefore = await productImageRepo.find({ withDeleted: true });
    const response = await testUploadMin(
      app,
      '/product-images/' + product.id + '/images/bulk',
      {
        metadata: JSON.stringify([
          { active: true, imageId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38' },
        ]),
      },
      [
        {
          field: 'files',
          buffer: file.buffer,
          filepath: file.originalname,
        },
      ],
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: ImageMessage.IMAGE_NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const imagesAfter = await productImageRepo.find({ withDeleted: true });
    expect(imagesAfter).toEqual(imagesBefore);
  });

  it('should reject when metadata contains image id of a different product', async () => {
    const [product1, product2, product3] =
      await testBuildProductImageUpdateScenario();
    const imagesBefore = await productImageRepo.find();
    const response = await testUploadMin(
      app,
      '/product-images/' + product1.id + '/images/bulk',
      {
        metadata: JSON.stringify([
          {
            imageId: product2.images[0].id,
            main: !!product2.images[0].main,
            active: !!product2.images[0].active,
            name: 'New name 1',
            description: 'New description 1',
          },
        ]),
      },
      [],
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    const imagesAfter = await productImageRepo.find();
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: ImageMessage.IMAGE_NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    expect(imagesBefore).toStrictEqual(imagesAfter);
  });

  it('should reject when metadata cointains multiple items with the same iamgeId', async () => {
    const products = await testBuildProductImageUpdateScenario();
    const imagesBefore = await productImageRepo.find();
    const response = await testUploadMin(
      app,
      '/product-images/' + products[0].id + '/images/bulk',
      {
        metadata: JSON.stringify([
          { imageId: products[0].images[0].id },
          { imageId: products[0].images[0].id },
        ]),
      },
      [],
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { metadata: ImagesMetadataMessage.IMAGE_ID_DUPLICATED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const imagesAfter = await productImageRepo.find();
    expect(imagesBefore).toStrictEqual(imagesAfter);
  });
});
