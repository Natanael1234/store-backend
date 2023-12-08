import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../src/modules/stock/brand/messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
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

describe('BrandController (e2e) - get /brands/:brandId (main)', () => {
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
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
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

  describe('findForId', () => {
    it('should find brand for id', async () => {
      const [brandId1, brandId2, brandId3] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3' },
      );
      const response = await testGetMin(
        app,
        `/brands/${brandId2}`,
        { query: `{}` },
        rootToken,
        HttpStatus.OK,
      );
      const brands = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .orderBy(BrandConstants.BRAND_NAME)
        .getMany();
      testValidateBrands(brands, [
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3', active: false },
      ]);
      testValidateBrand(response, { name: 'Brand 2', active: false });
    });

    it('should fail when brand does not exists', async () => {
      await insertBrands({ name: 'Brand 1', active: true });
      const response = await testGetMin(
        app,
        `/brands/f136f640-90b7-11ed-a2a0-fd911f8f7f38`,
        { query: `{}` },
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
});
