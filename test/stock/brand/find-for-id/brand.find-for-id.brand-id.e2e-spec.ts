import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../src/modules/stock/brand/messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import {
  TestBrandInsertParams,
  testInsertBrands,
  testValidateBrand,
  testValidateBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const BrandIdMessage = new UuidMessage('brand id');

describe('BrandController (e2e) - get/:brandId /brands (brandId)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    const tokens = await testBuildAuthenticationScenario(module);
    rootToken = tokens.rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close();
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  it('should find brand for valid brandId', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3' },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: false },
    ]);
    testValidateBrand(response, { name: 'Brand 2', active: true });
  });

  it('should reject when brandId is invalid string', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const response = await testGetMin(
      app,
      `/brands/not-a-valid-uuid`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.BAD_REQUEST,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    expect(response).toEqual({
      error: ExceptionText.BAD_REQUEST,
      message: BrandIdMessage.INVALID,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('should reject when brand does not exists', async () => {
    await insertBrands({ name: 'Brand 1', active: true });
    const response = await testGetMin(
      app,
      `/brands/f136f640-90b7-11ed-a2a0-fd911f8f7f38`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });
});
