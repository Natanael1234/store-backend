import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - post /users (authentication)', () => {
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
    await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      null,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should allow authenticaded user', async () => {
    await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.CREATED,
    );
  });
});
