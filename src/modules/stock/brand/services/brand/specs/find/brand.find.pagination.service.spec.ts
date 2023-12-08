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
import { BrandConfigs } from '../../../../configs/brand/brand.configs';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

describe('BrandService.find (pagination)', () => {
  let brandService: BrandService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  const count = 15;

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
    const response = await brandService.find();
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when pagination params is null', async () => {
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
    const response = await brandService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when pagination params is undefined', async () => {
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
    const response = await brandService.find(undefined);
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when params is empty', async () => {
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
    const response = await brandService.find({});
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
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
    const response = await brandService.find({ page, pageSize });
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: regs,
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
      const response = await brandService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({ page: null });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({ page: undefined });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        page: PaginationConfigs.MIN_PAGE + 0.1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        page: true as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        page: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        page: [] as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        page: '1' as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({ pageSize });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        pageSize: PaginationConfigs.MIN_PAGE_SIZE - 1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({ pageSize });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        pageSize: PaginationConfigs.MAX_PAGE_SIZE + 1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({ pageSize: null });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({ pageSize: undefined });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        pageSize: PaginationConfigs.MIN_PAGE_SIZE + 0.1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        pageSize: true as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        pageSize: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        pageSize: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
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
      const response = await brandService.find({
        pageSize: '1' as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });
});
