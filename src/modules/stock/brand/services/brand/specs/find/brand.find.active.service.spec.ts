import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { BrandConfigs } from '../../../../configs/brand/brand.configs';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const ActiveMessage = new BoolMessage('active');

describe('BrandService.find (active)', () => {
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

  it('should retrieve active and inactive brands when active = "all"', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({ active: ActiveFilter.ALL });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve inactive brands when active = "inactive"', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { active: false })
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({ active: ActiveFilter.INACTIVE });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve active brands when active = "active"', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({ active: ActiveFilter.ACTIVE });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve active brands when active = null ', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({ active: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should filter when active = undefined', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({ active: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when active is number', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
    );
    const fn = () =>
      brandService.find({ active: 1 as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
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

  it('should reject when active is boolean', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
    );
    const fn = () =>
      brandService.find({ active: true as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
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
      { name: 'Brand 2', active: true },
    );
    const fn = () =>
      brandService.find({ active: [] as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
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
      { name: 'Brand 2', active: true },
    );
    const fn = () =>
      brandService.find({ active: {} as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
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

  it('should reject when active is invalid string', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
    );
    const fn = () =>
      brandService.find({ active: 'invalid' as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
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
