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
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../../../system/messages/text-old/text.messages.enum';
import { BrandConfigs } from '../../../../configs/brand/brand.configs';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { BrandOrder } from '../../../../enums/brand-order/brand-order.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

function buildBrandData(quantity: number, startNumber?: number) {
  if (startNumber == null) startNumber = 1;
  return Array.from(Array(quantity), (x, idx) => ({
    name: `Brand ${startNumber + idx}`,
    active: true,
  }));
}

describe('BrandService.find', () => {
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

  it('should find brands with findDto with parameters', async () => {
    await insertBrands(
      { name: 'Brand 1', active: false },
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false, deletedAt: new Date() },
      { name: 'Brand 1', active: true, deletedAt: new Date() },

      { name: 'Brand 1 b', active: false },
      { name: 'Brand 1 b', active: true },
      { name: 'Brand 1 b', active: false, deletedAt: new Date() },
      { name: 'Brand 1 b', active: true, deletedAt: new Date() },

      { name: 'Brand 2', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false, deletedAt: new Date() },
      { name: 'Brand 2', active: true, deletedAt: new Date() },

      { name: 'Brand 2', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false, deletedAt: new Date() },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const registers = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_NAME_LIKE_TEXT_QUERY, {
        textQuery: '%and%1%',
      })
      .andWhere(BrandConstants.BRAND_DELETED_AT_IS_NOT_NULL)
      .orderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_NAME, SortConstants.DESC)
      .withDeleted()
      .take(3)
      .getMany();
    const response = await brandService.find({
      textQuery: 'and  1  ',
      active: ActiveFilter.ALL,
      deleted: DeletedFilter.DELETED,
      orderBy: [BrandOrder.ACTIVE_ASC, BrandOrder.NAME_DESC],
      page: 1,
      pageSize: 3,
    });
    expect(response).toEqual({
      textQuery: 'and 1',
      count: 4,
      page: 1,
      pageSize: 3,
      orderBy: [BrandOrder.ACTIVE_ASC, BrandOrder.NAME_DESC],
      results: registers,
    });
  });

  it('should find brands with empty findDto', async () => {
    const brandData: any = buildBrandData(15);
    brandData[3].active = false;
    brandData[5].deletedAt = new Date();
    const [brandId1, brandId2] = await insertBrands(...brandData);
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { active: true })
      .skip(0)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({});
    expect(response).toEqual({
      textQuery: undefined,
      count: 13,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should return empty list', async () => {
    const response = await brandService.find();
    expect(response).toEqual({
      textQuery: undefined,
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: [],
    });
  });

  it('should reject when data contains multiple errors', async () => {
    const insertData = new Array(15)
      .filter(() => {})
      .map((i) => {
        return { name: `Brand ${i + 1}`, active: true };
      });
    const [brandId1, brandId2] = await insertBrands(...insertData);
    const fn = () =>
      brandService.find({
        active: 'invalid_asc' as unknown as ActiveFilter,
        deleted: 'invalid_desc' as unknown as DeletedFilter,
        textQuery: true as unknown as string,
        page: '1' as unknown as number,
        pageSize: true as unknown as number,
        orderBy: true as unknown as BrandOrder[],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          active: ActiveMessage.INVALID,
          deleted: DeletedMessage.INVALID,
          textQuery: TextMessageOLD.INVALID,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should use default filter values when findDto is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default filter values when findDto is undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });
});
