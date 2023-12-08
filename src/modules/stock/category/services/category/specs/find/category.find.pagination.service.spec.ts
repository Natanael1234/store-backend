import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService.find (pagination)', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  const count = 15;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryService = module.get<CategoryService>(CategoryService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  it('should paginate without sending pagination params', async () => {
    const data = Array.from(Array(count), (x, i) => ({
      name: `Category ${i + 1}`,
      active: true,
    }));
    const categoriesIds = await insertCategories(...data);
    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find();
    expect(response).toEqual({
      count,
      page,
      pageSize,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when pagination params is null', async () => {
    const data = Array.from(Array(count), (x, i) => ({
      name: `Category ${i + 1}`,
      active: true,
    }));
    const categoriesIds = await insertCategories(...data);
    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find(null);
    expect(response).toEqual({
      count,
      page,
      pageSize,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when pagination params is undefined', async () => {
    const data = Array.from(Array(count), (x, i) => ({
      name: `Category ${i + 1}`,
      active: true,
    }));
    const categoriesIds = await insertCategories(...data);
    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find(undefined);
    expect(response).toEqual({
      count,
      page,
      pageSize,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when params is empty', async () => {
    const data = Array.from(Array(count), (x, i) => ({
      name: `Category ${i + 1}`,
      active: true,
    }));
    const categoriesIds = await insertCategories(...data);
    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({});
    expect(response).toEqual({
      count,
      page,
      pageSize,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when params contains valid paramaters', async () => {
    const data = Array.from(Array(count), (x, i) => ({
      name: `Category ${i + 1}`,
      active: true,
    }));
    const categoriesIds = await insertCategories(...data);
    const page = 2;
    const pageSize = 3;
    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({ page, pageSize });
    expect(response).toEqual({
      count,
      page,
      pageSize,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  // page

  describe('page', () => {
    it('should paginate when page is minimum allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.MIN_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when page is greater than allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.MIN_PAGE + 1;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when page is very great', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.MIN_PAGE + 1000;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate using default page when page is null', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ page: null });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate using default page when page is undefined', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ page: undefined });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is float', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ page: 1.1 });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is boolean', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        page: true as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is object', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        page: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is array', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        page: [] as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is string', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        page: '1' as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });

  // pageSize

  describe('pageSize', () => {
    it('should paginate when pageSize is minimum allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ pageSize });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when pageSize is smaller than allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        pageSize: PaginationConfigs.MIN_PAGE_SIZE - 1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when pageSize is maximum allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ pageSize });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate using maximum pageSize when pageSize is greater than allowed', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        pageSize: PaginationConfigs.MAX_PAGE_SIZE + 1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when pageSize is null', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ pageSize: null });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when pageSize is undefined', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({ pageSize: undefined });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is float', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        pageSize: PaginationConfigs.MIN_PAGE_SIZE + 0.1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is boolean', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        pageSize: true as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is object', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        pageSize: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is array', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        pageSize: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is string', async () => {
      const data = Array.from(Array(count), (x, i) => ({
        name: `Category ${i + 1}`,
        active: true,
      }));
      const categoriesIds = await insertCategories(...data);
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await categoryRepo
        .createQueryBuilder(CategoryConstants.CATEGORY)
        .leftJoinAndSelect(
          CategoryConstants.CATEGORY_PARENT,
          CategoryConstants.PARENT,
        )
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
        .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await categoryService.find({
        pageSize: '1' as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });
});
