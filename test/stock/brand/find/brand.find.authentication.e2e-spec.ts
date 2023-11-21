import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - find /brands (authentication)', () => {
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
    await testGetMin(app, '/brands', { query: '{}' }, null, HttpStatus.OK);
  });

  it('should allow authenticaded user', async () => {
    await testGetMin(app, '/brands', { query: '{}' }, rootToken, HttpStatus.OK);
  });

  it.skip('should exlude inactive and null items when not authenticated', async () => {});

  it.skip('should not exlude inactive and null items when authenticated', async () => {});
});
