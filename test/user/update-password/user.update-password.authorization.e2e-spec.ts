import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - patch /users/password (authorization)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let tokens: { rootToken: string; adminToken: string; userToken: string };

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();
    tokens = await testBuildAuthenticationScenario(moduleFixture);
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
  });

  it('should not allow basic user', async () => {
    await testPatchMin(
      app,
      '/users/password',
      { password: 'Xyz*123' },
      tokens.userToken,
      HttpStatus.OK,
    );
  });

  it('should not allow admin user', async () => {
    await testPatchMin(
      app,
      '/users/password',
      { password: 'Xyz*123' },
      tokens.adminToken,
      HttpStatus.OK,
    );
  });

  it('should allow root user', async () => {
    await testPatchMin(
      app,
      '/users/password',
      { password: 'Xyz*123' },
      tokens.rootToken,
      HttpStatus.OK,
    );
  });
});
