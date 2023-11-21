import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  testValidateBrand,
  testValidateBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { BrandConfigs } from '../../../../configs/brand/brand.configs';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const NameMessage = new TextMessage('name', {
  minLength: BrandConfigs.NAME_MIN_LENGTH,
  maxLength: BrandConfigs.NAME_MAX_LENGTH,
});

describe('BrandService.create (name)', () => {
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

  it('should accept when name has minimum allowed length', async () => {
    const name = 'x'.repeat(BrandConfigs.NAME_MIN_LENGTH);
    const data = { name };
    const expectedResults = [{ name, active: false }];
    const createdBrand = await brandService.create(data);
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await brandRepo.find();
    expect(brands).toHaveLength(1);
    testValidateBrands(brands, expectedResults);
  });

  it('should accept when name has maximum allowed length', async () => {
    const name = 'x'.repeat(BrandConfigs.NAME_MAX_LENGTH);
    const data = { name };
    const expectedResults = [{ name, active: false }];
    const createdBrand = await brandService.create(data);
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await brandRepo.find();
    expect(brands).toHaveLength(1);
    testValidateBrands(brands, expectedResults);
  });

  it('should reject when name is shorter than allowed', async () => {
    const fn = () =>
      brandService.create({
        name: 'x'.repeat(BrandConfigs.NAME_MIN_LENGTH - 1),
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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

  it('should reject when name is longer then allowed', async () => {
    const fn = () =>
      brandService.create({
        name: 'x'.repeat(BrandConfigs.NAME_MAX_LENGTH + 1),
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
    const fn = () => brandService.create({ name: null, active: true });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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

  it('should reject when name is undefined', async () => {
    const fn = () => brandService.create({ name: undefined, active: true });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is number', async () => {
    const fn = () =>
      brandService.create({ name: 1 as unknown as string, active: true });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
    const fn = () =>
      brandService.create({ name: true as unknown as string, active: true });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
    const fn = () =>
      brandService.create({ name: [] as unknown as string, active: true });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
    const fn = () =>
      brandService.create({ name: {} as unknown as string, active: true });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
