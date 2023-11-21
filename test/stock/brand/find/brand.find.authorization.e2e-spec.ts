import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - find /brands (authorization)', () => {
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
