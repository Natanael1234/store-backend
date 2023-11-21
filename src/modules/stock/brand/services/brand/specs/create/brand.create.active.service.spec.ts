import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  testValidateBrand,
  testValidateBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const ActiveMessage = new BoolMessage('active');

describe('BrandService.create (active)', () => {
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

  it('should accept when active is true', async () => {
    const createdBrand = await brandService.create({
      active: true,
      name: 'Brand 1',
    });
    const expectedResults = [{ active: true, name: 'Brand 1' }];
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .getMany();
    testValidateBrands(brands, expectedResults);
  });

  it('should accept when active is false', async () => {
    const createdBrand = await brandService.create({
      active: false,
      name: 'Brand 1',
    });
    const expectedResults = [{ active: false, name: 'Brand 1' }];
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .getMany();
    testValidateBrands(brands, expectedResults);
  });

  it('should accept when active is undefined', async () => {
    const createdBrand = await brandService.create({
      active: undefined,
      name: 'Brand 1',
    });
    const expectedResults = [{ active: false, name: 'Brand 1' }];
    testValidateBrand(createdBrand, expectedResults[0]);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .getMany();
    testValidateBrands(brands, expectedResults);
  });

  it('should reject when active is null', async () => {
    const fn = () => brandService.create({ name: 'Brand 1', active: null });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
    const fn = () =>
      brandService.create({ name: 'Brand 1', active: 1 as unknown as boolean });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
    const fn = () =>
      brandService.create({
        name: 'Brand 1',
        active: 'true' as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
    const fn = () =>
      brandService.create({
        name: 'Brand 1',
        active: [] as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
    const fn = () =>
      brandService.create({
        name: 'Brand 1',
        active: {} as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
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
