import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { testInsertCategories } from '../../../../src/test/category/test-category-utils';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('CategoryController (e2e) - get /categories/:categoryId (authorization)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let categoryRepo: CategoryRepository;
  let tokens: { rootToken: string; adminToken: string; userToken: string };

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    categoryRepo = moduleFixture.get<CategoryRepository>(CategoryRepository);
    await app.init();
    tokens = await testBuildAuthenticationScenario(moduleFixture);
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
  });

  it('should not allow basic user', async () => {
    const [categoriesId] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    await testGetMin(
      app,
      `/categories/${categoriesId}`,
      { query: `{}` },
      tokens.userToken,
      HttpStatus.OK,
    );
  });

  it('should allow admin user', async () => {
    const [categoriesId] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    await testGetMin(
      app,
      `/categories/${categoriesId}`,
      { query: `{}` },
      tokens.rootToken,
      HttpStatus.OK,
    );
  });

  it('should allow root user', async () => {
    const [categoriesId] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    await testGetMin(
      app,
      `/categories/${categoriesId}`,
      { query: `{}` },
      tokens.rootToken,
      HttpStatus.OK,
    );
  });
});
