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
  testValidateBrand,
  testValidateBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const BrandIdMessage = new UuidMessage('brand id');

describe('BrandService.findForId (brandId)', () => {
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

  it('should find brand for valid brandId', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3' },
    );
    const response = await brandService.findById(brandId2);
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

  it('should reject when brandId is null', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const fn = () => brandService.findById(null);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    await expect(fn()).rejects.toThrow(BrandIdMessage.REQUIRED);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandIdMessage.REQUIRED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is undefined', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const fn = () => brandService.findById(undefined);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    await expect(fn()).rejects.toThrow(BrandIdMessage.REQUIRED);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandIdMessage.REQUIRED,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is boolean', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const fn = () => brandService.findById(true as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is number', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const fn = () => brandService.findById(1 as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is invalid string', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const fn = () => brandService.findById('not-a-valid-uuid');
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is array', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const fn = () => brandService.findById([] as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brandId is object', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const fn = () => brandService.findById({} as unknown as string);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandIdMessage.INVALID,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when brand does not exists', async () => {
    await insertBrands({ name: 'Brand 1', active: true });
    const uuid = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
    const fn = () => brandService.findById(uuid);
    await expect(fn()).rejects.toThrow(NotFoundException);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
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
