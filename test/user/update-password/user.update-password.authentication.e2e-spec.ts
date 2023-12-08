import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - patch /users/password (authentication)', () => {
  let app: INestApplication;
  let module: TestingModule;
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
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should not allow unauthenticaded user', async () => {
    const ret = await testPatchMin(
      app,
      '/users/password',
      { password: 'Xyz*123' },
      null,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should allow authenticaded user', async () => {
    await testPatchMin(
      app,
      '/users/password',
      { password: 'Xyz*123' },
      rootToken,
      HttpStatus.OK,
    );
  });
});
