import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import { testInsertCategories } from '../../../../src/test/category/test-category-utils';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../../utils/test-end-to-end.utils';

describe('CategoryController (e2e) - get /category/:categoryId (authentication)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
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
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    await app.init();
    tokens = await testBuildAuthenticationScenario(module);
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should not allow unauthenticaded user', async () => {
    const [categoriesId] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    await testPatchMin(
      app,
      `/categories/${categoriesId}`,
      { query: JSON.stringify({ name: 'Category 1b', active: false }) },
      null,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should allow authenticaded user', async () => {
    const [categoriesId] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    await testPatchMin(
      app,
      `/categories/${categoriesId}`,
      { query: JSON.stringify({ name: 'Category 1b', active: false }) },
      tokens.rootToken,
      HttpStatus.OK,
    );
  });
});
