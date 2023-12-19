import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConfigs } from '../../../../src/modules/stock/brand/configs/brand/brand.configs';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../src/modules/system/messages/text/text.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import { testValidateBrands } from '../../../../src/test/brand/test-brand-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

const NameMessage = new TextMessage('name', {
  minLength: BrandConfigs.NAME_MIN_LENGTH,
  maxLength: BrandConfigs.NAME_MAX_LENGTH,
});
const ActiveMessage = new BoolMessage('active');

describe('BrandController (e2e) - post /brands (main)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    // app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close();
  });

  async function getBrands() {
    return brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .getMany();
  }

  it('should create brand', async () => {
    const expectedBrands = [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3', active: false },
    ];
    const createdBrands = [
      await testPostMin(
        app,
        '/brands',
        { name: 'Brand 1', active: true },
        rootToken,
        HttpStatus.CREATED,
      ),
      await testPostMin(
        app,
        '/brands',
        { name: 'Brand 2', active: false },
        rootToken,
        HttpStatus.CREATED,
      ),
      await testPostMin(
        app,
        '/brands',
        { name: 'Brand 3' },
        rootToken,
        HttpStatus.CREATED,
      ),
    ];
    testValidateBrands(createdBrands, expectedBrands);
    const brands = await getBrands();
    testValidateBrands(brands, expectedBrands);
  });

  it('should fail with multiple errors', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: 1.1, active: 'true' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID, active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });
});
