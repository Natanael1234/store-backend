import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - find /brands (authentication)', () => {
  let app: INestApplication;
  let moudle: TestingModule;
  let rootToken: string;

  beforeEach(async () => {
    moudle = await getTestingModule();
    app = moudle.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moudle)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moudle.close(); // TODO: é necessário?
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
