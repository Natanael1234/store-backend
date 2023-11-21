import {
  BadRequestException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testValidateBrands } from '../../../../../../../test/brand/test-brand-utils';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { BrandConfigs } from '../../../../configs/brand/brand.configs';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const NameMessage = new TextMessage('name', {
  minLength: BrandConfigs.NAME_MIN_LENGTH,
  maxLength: BrandConfigs.NAME_MAX_LENGTH,
});
const ActiveMessage = new BoolMessage('active');

describe('BrandService.create (main)', () => {
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

  it('should be defined', () => {
    expect(brandService).toBeDefined();
  });

  it('should create brand', async () => {
    const expectedBrands = [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3', active: false },
    ];
    const createdBrands = [
      await brandService.create({ name: 'Brand 1', active: true }),
      await brandService.create({ name: 'Brand 2', active: false }),
      await brandService.create({ name: 'Brand 3' }),
    ];
    testValidateBrands(createdBrands, expectedBrands);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .getMany();
    testValidateBrands(brands, expectedBrands);
  });

  it('should fail with multiple errors', async () => {
    const fn = () =>
      brandService.create({
        name: 1.1 as unknown as string,
        active: 'true' as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await brandRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID, active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  describe('createDto', () => {
    it('should fail when createDto is null', async () => {
      const fn = () => brandService.create(null);
      await expect(fn()).rejects.toThrow(BrandMessage.DATA_REQUIRED);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });

    it('should fail when createDto is undefined', async () => {
      const fn = () => brandService.create(undefined);
      await expect(fn()).rejects.toThrow(BrandMessage.DATA_REQUIRED);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });
  });
});
