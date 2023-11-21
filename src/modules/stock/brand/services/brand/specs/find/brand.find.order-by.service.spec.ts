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
import { BrandConfigs } from '../../../../configs/brand/brand.configs';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { BrandOrder } from '../../../../enums/brand-order/brand-order.enum';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

describe('BrandService.find (orderBy)', () => {
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

  it('should order by ["name_asc", "active_asc"]', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );

    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_ASC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_ASC],
      results: regs,
    });
  });

  it('should order by ["name_asc", "active_desc"]', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await brandService.find({
      orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_DESC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_DESC],
      results: regs,
    });
  });

  it('should order by ["name_desc", "active_asc"]', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.DESC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
      results: regs,
    });
  });

  it('should order by ["name_desc", "active_desc"]', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.DESC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await brandService.find({
      orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_DESC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_DESC],
      results: regs,
    });
  });

  it('should use default order when orderBy is null', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: null,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is undefined', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: undefined,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is string', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: '[]' as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains repeated column', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: ['invadlid_asc'] as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is number', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: undefined,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is number', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: 1 as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is boolean', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: true as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is array', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: [] as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is object', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );

    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: {} as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid string item', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: ['invalid_asc'] as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid number item', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: [1] as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid boolean item', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: [true] as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid array item', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: [[]] as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid object item', async () => {
    const [brandId1] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false },
    );
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await brandService.find({
      orderBy: [{}] as unknown as BrandOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });
});
