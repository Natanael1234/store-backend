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
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { FindBrandRequestDTO } from '../../../../dtos/find-brand/find-brand.request.dto';
import { BrandMessage } from '../../../../messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

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

  it('should find brand using default findBrandDto values when findBrandDto is not defined', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId1);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand using default findBrandDto values when findBrandDto is null', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId1, null);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand using default findBrandDto values when findBrandDto is undefined', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId1, undefined);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand using default findBrandDto values when findBrandDto is defined but empty', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand and use findBrandDto values when findBrandDto is defined', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const response = await brandService.findById(brandId4, {
      active: ActiveFilter.INACTIVE,
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId4,
      name: 'Brand 4',
      active: false,
      deleted: true,
    });
  });

  it('should not find brand using default findBrandDto values when findBrandDto is not defined', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const fn = () => brandService.findById(brandId4);
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should not find brand using default findBrandDto values when findBrandDto is null', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const fn = () => brandService.findById(brandId4, null);
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should not find brand using default findBrandDto values when findBrandDto is undefined', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const fn = () => brandService.findById(brandId4, undefined);
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should not find brand using default findBrandDto is defined but empty', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const fn = () => brandService.findById(brandId4, {});
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should not find brand when findBrandDto values are defined', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId4, {
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      });
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should reject find brand when findBrandDto is number', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId4, 1 as unknown as FindBrandRequestDTO);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandMessage.DATA_INVALID,
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should reject find brand when findBrandDto is boolean', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId4, true as unknown as FindBrandRequestDTO);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandMessage.DATA_INVALID,
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should reject find brand when findBrandDto is string', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId4, '{}' as unknown as FindBrandRequestDTO);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandMessage.DATA_INVALID,
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });

  it('should reject find brand when findBrandDto is array', async () => {
    const [brandId1, brandId2, brandId3, brandId4] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: false },
      { name: 'Brand 4', active: false, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.findById(brandId4, [] as unknown as FindBrandRequestDTO);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY,
        message: BrandMessage.DATA_INVALID,
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
      { id: brandId3, name: 'Brand 3', active: false },
      { id: brandId4, name: 'Brand 4', active: false, deleted: true },
    ]);
  });
});
