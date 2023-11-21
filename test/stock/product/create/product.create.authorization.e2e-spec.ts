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
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

describe('ProductController (e2e) - post /products (authorization)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let tokens: { rootToken: string; adminToken: string; userToken: string };

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();
    tokens = await testBuildAuthenticationScenario(moduleFixture);
    brandRepo = moduleFixture.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = moduleFixture.get<CategoryRepository>(CategoryRepository);
    productRepo = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
  });

  async function createTestScenario() {
    const [brandId] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
    ]);
    const [categoryId] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    return { brandId, categoryId };
  }

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
  });

  it('should not allow basic user', async () => {
    const { brandId, categoryId } = await createTestScenario();
    await testPostMin(
      app,
      '/products',
      {
        code: '0001',
        name: 'Product 1',
        model: 'Model 1',
        price: 1.99,
        quantityInStock: 50,
        active: true,
        brandId: brandId,
        categoryId: categoryId,
      },
      tokens.userToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should not allow admin user', async () => {
    const { brandId, categoryId } = await createTestScenario();
    await testPostMin(
      app,
      '/products',
      {
        code: '0001',
        name: 'Product 1',
        model: 'Model 1',
        price: 1.99,
        quantityInStock: 50,
        active: true,
        brandId: brandId,
        categoryId: categoryId,
      },
      tokens.adminToken,
      HttpStatus.CREATED,
    );
  });

  it('should allow root user', async () => {
    const { brandId, categoryId } = await createTestScenario();
    await testPostMin(
      app,
      '/products',
      {
        code: '0001',
        name: 'Product 1',
        model: 'Model 1',
        price: 1.99,
        quantityInStock: 50,
        active: true,
        brandId: brandId,
        categoryId: categoryId,
      },
      tokens.rootToken,
      HttpStatus.CREATED,
    );
  });
});
