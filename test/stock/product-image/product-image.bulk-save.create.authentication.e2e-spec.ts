import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Brand } from '../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../src/modules/stock/category/repositories/category.repository';
import { ProductImage } from '../../../src/modules/stock/product-image/models/product-image/product-image.entity';
import { ProductImageService } from '../../../src/modules/stock/product-image/services/product-image/product-image.service';
import { Product } from '../../../src/modules/stock/product/models/product/product.entity';
import { testInsertBrands } from '../../../src/test/brand/test-brand-utils';
import { testInsertCategories } from '../../../src/test/category/test-category-utils';
import { TestImages } from '../../../src/test/images/test-images';
import { testInsertProducts } from '../../../src/test/product/test-product-utils';
import { Client } from '../../__mocks__/minio';
import {
  testBuildAuthenticationScenario,
  testUploadMin,
} from '../../utils/test-end-to-end.utils';

describe('ProductImageController (e2e) - post /product-images/:productId/images/bulk (authentication)', () => {
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
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  /**
   * Image creation test scenario.
   * Create products and related entities but not images.
   * @param quantity number of products.
   * @returns products.
   */
  async function testBuildProductImageCreationScenario(quantity: 1 | 2 | 3) {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
    ]);
    const [categoryId1, categoryId2] = await testInsertCategories(
      categoryRepo,
      [
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: false },
      ],
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
    const productIds = await testInsertProducts(productRepo, productData);
    return productIds;
  }

  async function createTestScenario() {
    const [brandId] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
    ]);
    const [categoryId] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    return { brandId, categoryId };
  }

  it('should not allow unauthenticaded user', async () => {
    const { brandId, categoryId } = await createTestScenario();
    const [categoryId1] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: '[]' },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      null,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should allow authenticaded user', async () => {
    const { brandId, categoryId } = await createTestScenario();
    const [categoryId1] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    const [productId1] = await testBuildProductImageCreationScenario(1);
    const [file] = await TestImages.buildFiles(1);
    const response = await testUploadMin(
      app,
      '/product-images/' + productId1 + '/images/bulk',
      { metadata: '[]' },
      [{ field: 'files', buffer: file.buffer, filepath: file.originalname }],
      rootToken,
      HttpStatus.CREATED,
    );
  });
});
