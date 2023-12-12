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
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const DeletedFilterMessage = new BoolMessage('deleted');

describe('BrandService.findForId (findBrandDto)', () => {
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

  it('should find brand when findBrandDto.delete filter is not_deleted', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId1, {
      deleted: DeletedFilter.NOT_DELETED,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true, deleted: false },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
      deleted: false,
    });
  });

  it('should find brand when findBrandDto.deleted filter is deleted', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId2, {
      deleted: DeletedFilter.DELETED,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: true,
      deleted: true,
    });
  });

  it('should find brand when findBrandDto.deleted filter is all', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId2, {
      deleted: DeletedFilter.ALL,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: true,
      deleted: true,
    });
  });

  it('should find brand when findBrandDto.deleted filter is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId1, {
      deleted: null,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand when findBrandDto.deleted filter is undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId1, {
      deleted: undefined,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand when findBrandDto.deleted filter not defined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId1, {});
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should not find brand when findBrandDto.deleted filter is not_deleted', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId2, { deleted: DeletedFilter.NOT_DELETED });
    await expect(fn()).rejects.toThrow(NotFoundException);
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
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find brand when findBrandDto.deleted filter is deleted', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId1, { deleted: DeletedFilter.DELETED });
    await expect(fn()).rejects.toThrow(NotFoundException);
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
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find brand when findBrandDto.deleted filter is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () => brandService.findById(brandId2, { deleted: null });
    await expect(fn()).rejects.toThrow(NotFoundException);
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
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find brand when findBrandDto.deleted filter is undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () => brandService.findById(brandId2, { deleted: undefined });
    await expect(fn()).rejects.toThrow(NotFoundException);
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
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find brand when findBrandDto.deleted filter is not defined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () => brandService.findById(brandId2, {});
    await expect(fn()).rejects.toThrow(NotFoundException);
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
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when findBrandDto.deleted filter is number', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId1, {
        deleted: 1 as unknown as DeletedFilter.NOT_DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when findBrandDto.deleted filter is boolean', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId1, {
        deleted: true as unknown as DeletedFilter.NOT_DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when findBrandDto.deleted filter is invalid string', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId1, {
        deleted: 'invalid' as unknown as DeletedFilter.NOT_DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when findBrandDto.deleted filter is array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId1, {
        deleted: [] as unknown as DeletedFilter.NOT_DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when findBrandDto.deleted filter is object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId1, {
        deleted: {} as unknown as DeletedFilter.DELETED,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedFilterMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });
});
