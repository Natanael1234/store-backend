import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { UuidListMessage } from '../../../../../../system/messages/uuid-list/uuid-list.messages';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { Category } from '../../../../models/category/category.entity';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const ParentIdMessage = new UuidListMessage('parent ids', {
  maxLength: CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH,
});

describe('CategoryService.find (parentIds)', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryService = module.get<CategoryService>(CategoryService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should filter by parentId when receives array of parentIds', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where('parent.id IN (:...parentIds)', { parentIds: [c1.id] })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();

    const response = await categoryService.find({ parentIds: [c1.id] });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should return empy list when parent is not found', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const response = await categoryService.find({
      parentIds: ['f136f640-90b7-11ed-a2a0-fd911f8f7f38'],
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: [],
    });
  });

  it('should filter by parentId when receives array of parentIds and null', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where('(parent.id IN (:...parentIds) OR category.parent IS NULL)', {
        parentIds: [c1.id],
      })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({ parentIds: [c1.id, null] });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should filter by parentId when receives array containing only null', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.PARENT_IS_NULL)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({ parentIds: [null] });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should filter by parentId when receives array containing multiple nulls', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.PARENT_IS_NULL)
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({ parentIds: [null, null] });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should not filter by parentId when receives empty array', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({ parentIds: [] });
    expect(response).toEqual({
      textQuery: undefined,
      count: 5,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should filter by parentId when receives array with maximum allowed size', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const parentIds = Array.from(
      { length: CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH },
      (_, i) => uuidv4(),
    );
    parentIds[0] = c1.id;
    parentIds[1] = c2.id;
    parentIds[2] = c3.id;

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_PARENT_ID_IN, { parentIds })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();

    const response = await categoryService.find({ parentIds });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when parentIds is longer than allowed', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const parentIds = Array.from(
      { length: CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH + 1 },
      (_, i) => uuidv4(),
    );
    const fn = () => categoryService.find({ parentIds });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should not filter by parentId when receives null', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({ parentIds: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 5,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should not filter by parentId when receives undefined', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({ parentIds: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 5,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when parentIds is number', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({ parentIds: 1 as unknown as string[] });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentIds is boolean', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({ parentIds: true as unknown as string[] });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentIds is string', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({ parentIds: '[]' as unknown as string[] });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentIds is object', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({ parentIds: {} as unknown as string[] });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should accept when parentIds is valid', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const regs = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where('parent.id IN (:...parentIds)', {
        parentIds: [c1.id],
      })
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .addOrderBy(CategoryConstants.CATEGORY_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await categoryService.find({
      parentIds: [c1.id],
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when parentIds item is undefined', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({
        parentIds: [undefined] as unknown as string[],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.ITEM_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentIds item is number', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({ parentIds: [1] as unknown as string[] });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.ITEM_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentIds item is boolean', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({ parentIds: [true] as unknown as string[] });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.ITEM_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentIds item is invalid string', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({
        parentIds: ['not-a-valid-uuid'] as unknown as string[],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.ITEM_INVALID },

        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentIds item is array', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({ parentIds: [[]] as unknown as string[] });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.ITEM_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentIds item is object', async () => {
    // id 1
    const c1 = new Category();
    c1.name = 'Category 1';
    c1.active = true;
    await categoryRepo.save(c1);

    // id 2
    const c2 = new Category();
    c2.name = 'Category 2';
    c2.active = true;
    await categoryRepo.save(c2);

    // id 3
    const c3 = new Category();
    c3.name = 'Category 3';
    c3.parent = c1;
    c3.active = true;
    await categoryRepo.save(c3);

    // id 4
    const c4 = new Category();
    c4.name = 'Category 4';
    c4.parent = c1;
    c4.active = true;
    await categoryRepo.save(c4);

    // id 5
    const c5 = new Category();
    c5.name = 'Category 5';
    c5.parent = c3;
    c5.active = true;
    await categoryRepo.save(c5);

    const fn = () =>
      categoryService.find({ parentIds: [{}] as unknown as string[] });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentIds: ParentIdMessage.ITEM_INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
