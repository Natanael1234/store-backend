import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - get /users (authorization)', () => {
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
    await testGetMin(
      app,
      '/users',
      { query: '' },
      tokens.userToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should not allow admin user', async () => {
    await testGetMin(
      app,
      '/users',
      { query: '' },
      tokens.adminToken,
      HttpStatus.OK,
    );
  });

  it('should allow root user', async () => {
    await testGetMin(
      app,
      '/users',
      { query: '' },
      tokens.rootToken,
      HttpStatus.OK,
    );
  });
});
