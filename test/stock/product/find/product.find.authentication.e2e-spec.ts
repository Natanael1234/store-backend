import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { testInsertBrands } from '../../../../src/test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../src/test/category/test-category-utils';
import { testInsertProducts } from '../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('ProductController (e2e) - get /products (authentication)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let rootToken: string;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    brandRepo = moduleFixture.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = moduleFixture.get<CategoryRepository>(CategoryRepository);
    productRepo = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
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

  it('should not allow unauthenticaded user', async () => {
    const { brandId, categoryId, productId } = await createTestScenario();
    await testGetMin(app, '/products', { query: '{}' }, null, HttpStatus.OK);
  });

  it('should allow authenticaded user', async () => {
    const { brandId, categoryId, productId } = await createTestScenario();
    await testGetMin(
      app,
      '/products',
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
  });
});