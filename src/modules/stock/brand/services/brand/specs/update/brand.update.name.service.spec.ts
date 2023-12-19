import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
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
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { BrandConfigs } from '../../../../configs/brand/brand.configs';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const { NAME_MAX_LENGTH, NAME_MIN_LENGTH } = BrandConfigs;

const NameMessage = new TextMessage('name', {
  minLength: NAME_MIN_LENGTH,
  maxLength: NAME_MAX_LENGTH,
});

describe('BrandService.update (name)', () => {
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

  it(`should accept when name has minimum allowed length`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const name = 'x'.repeat(NAME_MIN_LENGTH);
    const brandId = brandId1;
    const data = { name };
    const expectedResults = [
      { id: brandId1, name: name, active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ];
    const brandsBefore = await brandRepo.find();
    const updatedBrand = await brandService.update(brandId, data);
    expect(updatedBrand).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.name == name);
    testValidateBrand(updatedBrand, expectedResult);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toHaveLength(expectedResults.length);
    testValidateBrands(brandsAfter, expectedResults);
  });

  it(`should accept when name has maximum allowed length`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const name = 'x'.repeat(NAME_MAX_LENGTH);
    const brandId = brandId1;
    const data = { name };
    const expectedResults = [
      { id: brandId1, name: name, active: true },
      { id: brandId2, name: 'Brand 2', active: false },
    ];
    const brandsBefore = await brandRepo.find();
    const updatedBrand = await brandService.update(brandId, data);
    expect(updatedBrand).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.name == name);
    testValidateBrand(updatedBrand, expectedResult);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toHaveLength(expectedResults.length);
    testValidateBrands(brandsAfter, expectedResults);
  });

  it(`should accept when name is undefined`, async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandId = brandId1;
    const data = { name: undefined, active: false };
    const expectedResults = [
      { id: brandId1, name: 'Brand 1', active: false },
      { id: brandId2, name: 'Brand 2', active: false },
    ];
    const brandsBefore = await brandRepo.find();
    const updatedBrand = await brandService.update(brandId, data);
    expect(updatedBrand).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.name == 'Brand 1');
    testValidateBrand(updatedBrand, expectedResult);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toHaveLength(expectedResults.length);
    testValidateBrands(brandsAfter, expectedResults);
  });

  it('should reject when name is too short', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, {
        name: 'x'.repeat(NAME_MIN_LENGTH - 1) as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.MIN_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is too long', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, {
        name: 'x'.repeat(NAME_MAX_LENGTH + 1) as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () => brandService.update(brandId2, { name: null });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is number', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, { name: 2323232 as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is boolean', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, { name: true as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, { name: [] as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, { name: {} as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
