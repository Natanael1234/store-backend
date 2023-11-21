import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - get /users (authentication)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
  });

  it('should not allow unauthenticaded user', async () => {
    await testGetMin(
      app,
      '/users',
      { query: '' },
      null,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should allow authenticaded user', async () => {
    await testGetMin(app, '/users', { query: '' }, rootToken, HttpStatus.OK);
  });
});
