import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { BrandMessage } from '../../../../messages/brand-messages/brand.messages.enum';
import { BrandService } from '../../brand.service';

describe('BrandService.update (brandId)', () => {
  let brandService: BrandService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await getTestingModule();
    brandService = module.get<BrandService>(BrandService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it(`should reject when brandId is null`, async () => {
    const fn = () => brandService.update(null, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(BrandMessage.REQUIRED_BRAND_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when brandId is undefined`, async () => {
    const fn = () => brandService.update(undefined, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(BrandMessage.REQUIRED_BRAND_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when brandId is number`, async () => {
    const fn = () =>
      brandService.update(1 as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(BrandMessage.INVALID_BRAND_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when brandId is boolean`, async () => {
    const fn = () =>
      brandService.update(true as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(BrandMessage.INVALID_BRAND_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when brandId is invalid string`, async () => {
    const fn = () =>
      brandService.update('not-a-valid-uuid', { name: 'New Name' });
    await expect(fn()).rejects.toThrow(BrandMessage.INVALID_BRAND_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when brandId is array`, async () => {
    const fn = () =>
      brandService.update([] as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(BrandMessage.INVALID_BRAND_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when brandId is object`, async () => {
    const fn = () =>
      brandService.update({} as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(BrandMessage.INVALID_BRAND_ID);
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
