import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import { testInsertBrands } from '../../../../src/test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../src/test/category/test-category-utils';
import { testInsertProducts } from '../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../../utils/test-end-to-end.utils';

describe('ProductController (e2e) - patch /products/:productId (authorization)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let tokens: { rootToken: string; adminToken: string; userToken: string };

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    await app.init();
    tokens = await testBuildAuthenticationScenario(module);
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  async function createTestScenario() {
    const [brandId] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
    ]);
    const [categoryId] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    const [productId] = await testInsertProducts(productRepo, [
      {
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId,
        categoryId: categoryId,
      },
    ]);
    return { brandId, categoryId, productId };
  }

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should not allow basic user', async () => {
    const { brandId, categoryId, productId } = await createTestScenario();
    await testPatchMin(
      app,
      '/products/' + productId,
      {
        code: '00000001b',
        name: 'Product 2b',
        model: 'Model 1b',
        price: 500,
        quantityInStock: 600,
        active: true,
      },
      tokens.userToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should not allow admin user', async () => {
    const { brandId, categoryId, productId } = await createTestScenario();
    await testPatchMin(
      app,
      '/products/' + productId,
      {
        code: '00000001b',
        name: 'Product 2b',
        model: 'Model 1b',
        price: 500,
        quantityInStock: 600,
        active: true,
      },
      tokens.adminToken,
      HttpStatus.OK,
    );
  });

  it('should allow root user', async () => {
    const { brandId, categoryId, productId } = await createTestScenario();
    await testPatchMin(
      app,
      '/products/' + productId,
      {
        code: '00000001b',
        name: 'Product 2b',
        model: 'Model 1b',
        price: 500,
        quantityInStock: 600,
        active: true,
      },
      tokens.rootToken,
      HttpStatus.OK,
    );
  });
});
