import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - find /brands (authorization)', () => {
  let app: INestApplication;
  let module: TestingModule;

  let tokens: { rootToken: string; adminToken: string; userToken: string };

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
    tokens = await testBuildAuthenticationScenario(module);
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should not allow basic user', async () => {
    await testGetMin(
      app,
      '/brands',
      { query: `{}` },
      tokens.userToken,
      HttpStatus.OK,
    );
  });

  it('should not allow admin user', async () => {
    await testGetMin(
      app,
      '/brands',
      { query: `{}` },
      tokens.adminToken,
      HttpStatus.OK,
    );
  });

  it('should allow root user', async () => {
    await testGetMin(
      app,
      '/brands',
      { query: `{}` },
      tokens.rootToken,
      HttpStatus.OK,
    );
  });
});
