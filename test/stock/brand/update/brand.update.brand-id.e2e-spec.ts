import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../src/modules/stock/brand/messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestBrandInsertParams,
  testInsertBrands,
  testValidateBrand,
  testValidateBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../../utils/test-end-to-end.utils';

const BrandIdMessage = new UuidMessage('brand id');

describe('BrandController (e2e) - patch /brands/:brandId (brandId)', () => {
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

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  it('should update brand when brandId is valid', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const updatedBrand = await testPatchMin(
      app,
      `/brands/${brandId1}`,
      { name: 'Brand 1b', active: true },
      rootToken,
      HttpStatus.OK,
    );
    const expectedResults = [
      { id: brandId1, name: 'Brand 1b', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ];
    testValidateBrand(updatedBrand, expectedResults[0]);
    const brandsAfter = await getBrands();
    testValidateBrands(brandsAfter, expectedResults);
  });

  it(`should reject when brandId is invalid string`, async () => {
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/not-a-valid-uuid`,
      { name: 'New Name' },
      rootToken,
      HttpStatus.BAD_REQUEST,
    );
    expect(response).toEqual({
      error: ExceptionText.BAD_REQUEST,
      message: BrandIdMessage.INVALID,
      statusCode: HttpStatus.BAD_REQUEST,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });

  it(`should reject when brandId is not found`, async () => {
    const brandsBefore = await getBrands();
    const response = await testPatchMin(
      app,
      `/brands/f136f640-90b7-11ed-a2a0-fd911f8f7f38`,
      { name: 'New Name' },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    expect(brandsBefore).toStrictEqual(await getBrands());
  });
});
