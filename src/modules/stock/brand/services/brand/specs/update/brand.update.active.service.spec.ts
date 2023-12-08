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
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const ActiveMessage = new BoolMessage('active');

describe('BrandService.update (active)', () => {
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

  it('should accept when active is true', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3' },
    );
    const brandId = brandId1;
    const data = { active: true };
    const expectedResults = [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true },
      { id: brandId3, name: 'Brand 3', active: false },
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

  it('should accept when active is false', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3' },
    );
    const brandId = brandId2;
    const data = { name: undefined, active: false };
    const expectedResults = [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
      { id: brandId3, name: 'Brand 3', active: false },
    ];
    const brandsBefore = await brandRepo.find();
    const updatedBrand = await brandService.update(brandId, data);
    expect(updatedBrand).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.name == 'Brand 2');
    testValidateBrand(updatedBrand, expectedResult);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toHaveLength(expectedResults.length);
    testValidateBrands(brandsAfter, expectedResults);
  });

  it('should accept when active is undefined', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    );
    const brandId = brandId1;
    const data = { name: 'New Name', active: undefined };
    const expectedResults = [
      { id: brandId1, name: 'New Name', active: true },
      { id: brandId2, name: 'Brand 2', active: false },
      { id: brandId3, name: 'Brand 3', active: false },
    ];
    const brandsBefore = await brandRepo.find();
    const updatedBrand = await brandService.update(brandId, data);
    expect(updatedBrand).toBeDefined();
    const expectedResult = expectedResults.find((r) => r.id == brandId1);
    expect(expectedResult).toBeDefined();
    testValidateBrand(updatedBrand, expectedResult);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toHaveLength(expectedResults.length);
    testValidateBrands(brandsAfter, expectedResults);
  });

  it('should reject when active is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, { name: 'Brand 1', active: null });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is number', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, {
        name: 'Brand 1',
        active: 1 as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is string', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, {
        name: 'Brand 1',
        active: 'true' as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, {
        name: 'Brand 1',
        active: [] as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, {
        name: 'Brand 1',
        active: {} as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await brandRepo.find();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
