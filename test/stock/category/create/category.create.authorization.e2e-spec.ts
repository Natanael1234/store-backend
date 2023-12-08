import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

describe('CategoryController (e2e) - post /categories (authorization)', () => {
  let app: INestApplication;
  let module: TestingModule;

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
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should not allow basic user', async () => {
    await testPostMin(
      app,
      '/categories',
      { name: 'Category 1', active: true },
      tokens.userToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should not allow admin user', async () => {
    await testPostMin(
      app,
      '/categories',
      { name: 'Category 1', active: true },
      tokens.adminToken,
      HttpStatus.CREATED,
    );
  });

  it('should allow root user', async () => {
    await testPostMin(
      app,
      '/categories',
      { name: 'Category 1', active: true },
      tokens.rootToken,
      HttpStatus.CREATED,
    );
  });
});
