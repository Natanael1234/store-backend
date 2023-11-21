import { HttpStatus, INestApplication } from '@nestjs/common';
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
  testValidateBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  testBuildAuthenticationScenario,
  testDeleteMin,
} from '../../../utils/test-end-to-end.utils';

const BrandIdMessage = new UuidMessage('brand id');

describe('BrandController (e2e) - delete /brands/:bandId (main)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  describe('delete', () => {
    it('should delete brand', async () => {
      const [brandId1, brandId2, brandId3] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3' },
      );
      const response = await testDeleteMin(
        app,
        `/brands/${brandId2}`,
        { query: '' },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({ status: 'success' });
      const brands = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .withDeleted()
        .orderBy(BrandConstants.BRAND_NAME)
        .getMany();
      testValidateBrands(brands, [
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false, deleted: true },
        { name: 'Brand 3', active: false },
      ]);
    });

    it('should fail when brandIs is invalid', async () => {
      await insertBrands({ name: 'Brand 1', active: true });
      const response = await testDeleteMin(
        app,
        `/brands/not-a-valid-uuid`,
        { query: '' },
        rootToken,
        HttpStatus.BAD_REQUEST,
      );
      const brands = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .withDeleted()
        .orderBy(BrandConstants.BRAND_NAME)
        .getMany();
      testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
      expect(response).toEqual({
        error: ExceptionText.BAD_REQUEST,
        message: BrandIdMessage.INVALID,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should fail when brand does not exists', async () => {
      await insertBrands({ name: 'Brand 1', active: true });
      const response = await testDeleteMin(
        app,
        `/brands/f136f640-90b7-11ed-a2a0-fd911f8f7f38`,
        { query: '' },
        rootToken,
        HttpStatus.NOT_FOUND,
      );
      const brands = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .withDeleted()
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
