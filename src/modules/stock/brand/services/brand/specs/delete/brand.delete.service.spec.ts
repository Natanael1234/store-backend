import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestBrandInsertParams,
  testInsertBrands,
  testValidateBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

describe('BrandService', () => {
  let brandService: BrandService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    brandService = module.get<BrandService>(BrandService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  it('should be defined', () => {
    expect(brandService).toBeDefined();
  });

  describe('delete', () => {
    it('should delete brand', async () => {
      const [brandId1, brandId2, brandId3] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3' },
      );
      const response = await brandService.delete(brandId2);
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

    it('should fail when brandId is not defined', async () => {
      await insertBrands({ name: 'Brand 1', active: true });
      const fn = () => brandService.delete(null);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      const brands = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .withDeleted()
        .orderBy(BrandConstants.BRAND_NAME)
        .getMany();
      testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
      await expect(fn()).rejects.toThrow(BrandMessage.REQUIRED_BRAND_ID);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.UNPROCESSABLE_ENTITY,
          message: BrandMessage.REQUIRED_BRAND_ID,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail when brand does not exists', async () => {
      await insertBrands({ name: 'Brand 1', active: true });
      const uuid = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
      const fn = () => brandService.delete(uuid);
      await expect(fn()).rejects.toThrow(NotFoundException);
      const brands = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .withDeleted()
        .orderBy(BrandConstants.BRAND_NAME)
        .getMany();
      testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
      await expect(fn()).rejects.toThrow(BrandMessage.NOT_FOUND);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: ExceptionText.NOT_FOUND,
          message: BrandMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
    });
  });
});
