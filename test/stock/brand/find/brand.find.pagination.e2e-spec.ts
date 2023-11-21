import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConfigs } from '../../../../src/modules/stock/brand/configs/brand/brand.configs';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - find /brands (pagination)', () => {
  const count = 15;

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

  it('should paginate without sending pagination params', async () => {
    const data = Array.from(Array(count), (x, i) => ({
      name: `Brand ${i + 1}`,
      active: true,
    }));
    const [brandId1] = await insertBrands(...data);
    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should paginate when params contains valid paramaters', async () => {
    const data = Array.from(Array(count), (x, i) => ({
      name: `Brand ${i + 1}`,
      active: true,
    }));
    const [brandId1] = await insertBrands(...data);
    const page = 2;
    const pageSize = 3;
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(BrandConstants.NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: JSON.stringify({ page, pageSize }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  // page

  describe('page', () => {
    it('should paginate when page is minimum allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.MIN_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when page is greater than allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.MIN_PAGE + 1;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when page is very great', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.MIN_PAGE + 1000;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate using default page when page is null', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page: null }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate using default page when page is undefined', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is float', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page: PaginationConfigs.MIN_PAGE + 0.1 }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is boolean', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page: true }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is object', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page: {} }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is array', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page: [] }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is string', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ page: '1' }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });
  });

  // pageSize

  describe('pageSize', () => {
    it('should paginate when pageSize is minimum allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ pageSize }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is smaller than allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        {
          query: JSON.stringify({
            pageSize: PaginationConfigs.MIN_PAGE_SIZE - 1,
          }),
        },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is maximum allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ pageSize }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate using maximum pageSize when pageSize is greater than allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        {
          query: JSON.stringify({
            pageSize: PaginationConfigs.MAX_PAGE_SIZE + 1,
          }),
        },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is null', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ pageSize: null }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is undefined', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ pageSize: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is float', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        {
          query: JSON.stringify({
            pageSize: PaginationConfigs.MIN_PAGE_SIZE + 0.1,
          }),
        },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is boolean', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ pageSize: true }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is object', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ pageSize: {} }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is array', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ pageSize: {} }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is string', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Brand ${i + 1}`,
        active: true,
      }));
      const [brandId1] = await insertBrands(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(BrandConstants.NAME, SortConstants.ASC)
        .addOrderBy(BrandConstants.ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await testGetMin(
        app,
        '/brands',
        { query: JSON.stringify({ pageSize: '1' }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });
  });
});
