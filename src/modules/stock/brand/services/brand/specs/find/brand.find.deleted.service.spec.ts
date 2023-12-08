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
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { BrandConfigs } from '../../../../configs/brand/brand.configs';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const DeletedMessage = new BoolMessage('deleted');

describe('BrandService.find (deleted)', () => {
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

  it('should retrieve deleted and non deleted brands when deleted = "all"', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({ deleted: DeletedFilter.ALL });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve deleted brands when deleted = "deleted"', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_DELETED_AT_IS_NOT_NULL)
      .withDeleted()
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      deleted: DeletedFilter.DELETED,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve not deleted brands when deleted = "not_deleted"', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      deleted: DeletedFilter.NOT_DELETED,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve not deleted brands when deleted = null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({ deleted: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve not deleted brands when deleted = undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
      { name: 'Brand 3', active: true },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({ deleted: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when deleted is invalid boolean', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.find({ deleted: true as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deleted is invalid array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.find({ deleted: [] as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deleted is invalid object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.find({ deleted: {} as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deleted is invalid string', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const fn = () =>
      brandService.find({ deleted: '1' as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
