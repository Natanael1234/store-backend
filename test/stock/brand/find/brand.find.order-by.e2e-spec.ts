import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConfigs } from '../../../../src/modules/stock/brand/configs/brand/brand.configs';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandOrder } from '../../../../src/modules/stock/brand/enums/brand-order/brand-order.enum';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - find /brands (orderBy)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
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
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({
          orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_ASC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({
          orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_DESC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_DESC],
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({
          orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({
          orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_DESC],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_DESC],
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: null, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({ orderBy: undefined, active: ActiveFilter.ALL }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: '[]', active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({
          orderBy: ['invadlid_asc'],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({ orderBy: undefined, active: ActiveFilter.ALL }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: 1, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: true, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: [], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: {}, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({
          orderBy: ['invalid_asc'],
          active: ActiveFilter.ALL,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: [1], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: [true], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: [[]], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ orderBy: [{}], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });
});
