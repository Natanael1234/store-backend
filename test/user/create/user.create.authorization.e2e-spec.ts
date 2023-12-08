import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - post /users (authorization)', () => {
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
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      tokens.userToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should not allow admin user', async () => {
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
      tokens.adminToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should allow root user', async () => {
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
      tokens.rootToken,
      HttpStatus.CREATED,
    );
  });
});
