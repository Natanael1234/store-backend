import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - post /brands (authentication)', () => {
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
