import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - post /brands (authentication)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should not allow unauthenticaded user', async () => {
    await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: true },
      null,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should allow authenticaded user', async () => {
    await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: true },
      rootToken,
      HttpStatus.CREATED,
    );
  });
});
