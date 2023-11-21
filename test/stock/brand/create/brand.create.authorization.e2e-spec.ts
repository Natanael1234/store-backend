import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - post /brands (authorization)', () => {
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
    await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: true },
      tokens.userToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should not allow admin user', async () => {
    await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: true },
      tokens.adminToken,
      HttpStatus.CREATED,
    );
  });

  it('should allow root user', async () => {
    await testPostMin(
      app,
      '/brands',
      { name: 'Brand 1', active: true },
      tokens.rootToken,
      HttpStatus.CREATED,
    );
  });
});
