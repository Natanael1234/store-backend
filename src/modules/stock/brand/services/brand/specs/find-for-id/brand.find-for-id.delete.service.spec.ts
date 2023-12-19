import { HttpStatus, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testInsertBrands } from '../../../../../../../test/brand/test-brand-utils';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const DeletedFilterMessage = new BoolMessage('deleted');

describe('BrandService.findForId (publicAccess)', () => {
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

  async function getBrands() {
    return await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
  }

  it('should find not deleted brand when publicAccess is true', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const response = await brandService.findById(brandId1, true);
    expect(response).toEqual(brandsBefore[0]);
    expect(await getBrands()).toEqual(brandsBefore);
  });

  it('should find not deleted brand when publicAccess is false', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const response = await brandService.findById(brandId1, false);
    expect(response).toEqual(brandsBefore[0]);
    expect(await getBrands()).toEqual(brandsBefore);
  });

  it('should find not deleted brand when publicAccess null', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const response = await brandService.findById(brandId1, null);
    expect(response).toEqual(brandsBefore[0]);
    expect(await getBrands()).toEqual(brandsBefore);
  });

  it('should find not deleted brand when publicAccess undefined', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const response = await brandService.findById(brandId1, undefined);
    expect(response).toEqual(brandsBefore[0]);
    expect(await getBrands()).toEqual(brandsBefore);
  });

  it('should find not deleted brand when publicAccess is not defined', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const response = await brandService.findById(brandId1);
    expect(response).toEqual(brandsBefore[0]);
    expect(await getBrands()).toEqual(brandsBefore);
  });

  it('should find deleted brand when publicAccess is false', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const response = await brandService.findById(brandId2, false);
    expect(response).toEqual(brandsBefore[1]);
    expect(await getBrands()).toEqual(brandsBefore);
  });

  it('should find deleted brand when publicAccess is null', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const response = await brandService.findById(brandId2, null);
    expect(response).toEqual(brandsBefore[1]);
    expect(await getBrands()).toEqual(brandsBefore);
  });

  it('should find deleted brand when publicAccess is undfined', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const response = await brandService.findById(brandId2, undefined);
    expect(response).toEqual(brandsBefore[1]);
    expect(await getBrands()).toEqual(brandsBefore);
  });

  it('should find deleted brand when publicAccess is not defined', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const response = await brandService.findById(brandId2);
    expect(response).toEqual(brandsBefore[1]);
    expect(await getBrands()).toEqual(brandsBefore);
  });

  it('should not find deleted brand when publicAccess is true', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await getBrands();
    const fn = () => brandService.findById(brandId2, true);
    await expect(fn()).rejects.toThrow(NotFoundException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: BrandMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    expect(await getBrands()).toEqual(brandsBefore);
  });
});
