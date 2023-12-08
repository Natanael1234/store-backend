import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConfigs } from '../../../../src/modules/stock/brand/configs/brand/brand.configs';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../src/modules/system/messages/text/text.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testValidateBrand,
  testValidateBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

const NameMessage = new TextMessage('name', {
  minLength: BrandConfigs.NAME_MIN_LENGTH,
  maxLength: BrandConfigs.NAME_MAX_LENGTH,
});

describe('BrandController (e2e) - post /brands (name)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    // app.setGlobalPrefix('api');
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

  it('should accept when name has minimum allowed length', async () => {
    const name = 'x'.repeat(BrandConfigs.NAME_MIN_LENGTH);
    const data = { name };
    const expectedResults = [{ name, active: false }];
    const createdBrand = await testPostMin(
      app,
      '/brands',
      data,
      rootToken,
      HttpStatus.CREATED,
    );
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await getBrands();
    expect(brands).toHaveLength(1);
    testValidateBrands(brands, expectedResults);
  });

  it('should accept when name has maximum allowed length', async () => {
    const name = 'x'.repeat(BrandConfigs.NAME_MAX_LENGTH);
    const data = { name };
    const expectedResults = [{ name, active: false }];
    const createdBrand = await testPostMin(
      app,
      '/brands',
      data,
      rootToken,
      HttpStatus.CREATED,
    );
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await getBrands();
    expect(brands).toHaveLength(1);
    testValidateBrands(brands, expectedResults);
  });

  it('should reject when name is shorter than allowed', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: 'x'.repeat(BrandConfigs.NAME_MIN_LENGTH - 1), active: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MIN_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when name is longer then allowed', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: 'x'.repeat(BrandConfigs.NAME_MAX_LENGTH + 1), active: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when name is null', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: null, active: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when name is undefined', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: undefined, active: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.REQUIRED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when name is number', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: 1, active: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when name is boolean', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: true, active: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when name is array', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: [], active: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });

  it('should reject when name is object', async () => {
    const response = await testPostMin(
      app,
      '/brands',
      { name: {}, active: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await brandRepo.count()).toEqual(0);
  });
});
