import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConfigs } from '../../../../src/modules/stock/category/configs/category/category.configs';
import { CategoryConstants } from '../../../../src/modules/stock/category/constants/category/categoryd-entity.constants';
import { Category } from '../../../../src/modules/stock/category/models/category/category.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidListMessage } from '../../../../src/modules/system/messages/uuid-list/uuid-list.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ParentIdMessage = new UuidListMessage('parent ids', {
  maxLength: CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH,
});

describe('CategoryController (e2e) - get /categories (parentIds)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [c1.id] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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

    const response = await testGetMin(
      app,
      '/categories',
      {
        query: JSON.stringify({
          parentIds: ['f136f640-90b7-11ed-a2a0-fd911f8f7f38'],
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
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
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [c1.id, null] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should filter by null parentId when receives array containing only null', async () => {
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
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [null] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should filter by null parentId when receives array containing only undefined', async () => {
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
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [undefined] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [null, null] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 5,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: null }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 5,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: undefined }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 5,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: 1 }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: true }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: '[]' }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: {} }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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
    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [c1.id] }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [1] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [true] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: ['not-a-valid-uuid'] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [[]] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
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

    const response = await testGetMin(
      app,
      '/categories',
      { query: JSON.stringify({ parentIds: [{}] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { parentIds: ParentIdMessage.ITEM_INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
