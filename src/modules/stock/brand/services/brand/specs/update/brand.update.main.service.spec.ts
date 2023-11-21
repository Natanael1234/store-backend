import {
  BadRequestException,
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
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { BrandConfigs } from '../../../../configs/brand/brand.configs';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const { NAME_MAX_LENGTH, NAME_MIN_LENGTH } = BrandConfigs;

const NameMessage = new TextMessage('name', {
  minLength: NAME_MIN_LENGTH,
  maxLength: NAME_MAX_LENGTH,
});
const ActiveMessage = new BoolMessage('active');
const BrandIdMessage = new UuidMessage('brand id');

describe('BrandService.update (main)', () => {
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

  it('should update brand', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    );
    const updatedBrand = await brandService.update(brandId2, {
      name: 'New Name',
      active: true,
    });
    const expectedResults = [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'New Name', active: true },
      { id: brandId3, name: 'Brand 3', active: false },
    ];
    testValidateBrand(updatedBrand, expectedResults[1]);
    const brandsAfter = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .getMany();
    testValidateBrands(brandsAfter, expectedResults);
  });

  it('should reject when multiple fields are invalid', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const brandsBefore = await brandRepo.find();
    const fn = () =>
      brandService.update(brandId2, {
        name: 1 as unknown as string,
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
        message: { name: NameMessage.INVALID, active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  describe('brandId', () => {
    it(`should accept when minimum brandId`, async () => {
      const [brandId1, brandId2] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
      );
      const brandId = brandId1;
      const data = { name: 'New Name' };
      const expectedResults = [
        { id: brandId1, name: 'New Name', active: true },
        { id: brandId2, name: 'Brand 2', active: false },
      ];
      const updatedBrand = await brandService.update(brandId, data);
      expect(updatedBrand).toBeDefined();
      const expectedResult = expectedResults.find((r) => r.name == 'New Name');
      testValidateBrand(updatedBrand, expectedResult);
      const brandsAfter = await brandRepo.find();
      testValidateBrands(brandsAfter, expectedResults);
    });

    it(`should reject when brandId is null`, async () => {
      const fn = () => brandService.update(null, { name: 'New Name' });
      await expect(fn()).rejects.toThrow(BrandIdMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it(`should reject when brandId is undefined`, async () => {
      const fn = () => brandService.update(undefined, { name: 'New Name' });
      await expect(fn()).rejects.toThrow(BrandIdMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it(`should reject when brandId is number`, async () => {
      const fn = () =>
        brandService.update(1 as unknown as string, { name: 'New Name' });
      await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it(`should reject when brandId is boolean`, async () => {
      const fn = () =>
        brandService.update(true as unknown as string, { name: 'New Name' });
      await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it(`should reject when brandId is invalid string`, async () => {
      const fn = () =>
        brandService.update('not-a-valid-uuid', { name: 'New Name' });
      await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it(`should reject when brandId is array`, async () => {
      const fn = () =>
        brandService.update([] as unknown as string, { name: 'New Name' });
      await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it(`should reject when brandId is object`, async () => {
      const fn = () =>
        brandService.update({} as unknown as string, { name: 'New Name' });
      await expect(fn()).rejects.toThrow(BrandIdMessage.INVALID);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it(`should reject when brandId is not found`, async () => {
      const fn = () =>
        brandService.update('f136f640-90b7-11ed-a2a0-fd911f8f7f38', {
          name: 'New Name',
        });
      await expect(fn()).rejects.toThrow(BrandMessage.NOT_FOUND);
      await expect(fn()).rejects.toThrow(NotFoundException);
    });
  });

  describe('brandDto', () => {
    it('should reject when brand data is null', async () => {
      const [brandId1, brandId2] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
      );
      const fn = () => brandService.update(brandId1, null);
      await expect(fn()).rejects.toThrow(BrandMessage.DATA_REQUIRED);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });

    it('should reject when brand data is undefined', async () => {
      const [brandId1, brandId2] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
      );
      const fn = () => brandService.update(brandId1, undefined);
      await expect(fn()).rejects.toThrow(BrandMessage.DATA_REQUIRED);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });
  });
});
