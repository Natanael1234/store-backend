import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { PaginationConfigs } from '../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../src/modules/system/messages/text-old/text.messages.enum';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { objectToJSON } from '../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - get /users (textQuery)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let userRepo: Repository<User>;
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
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should match one result when filtering by text', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_EMAIL_EQUALS_TO, { email: 'user1@email.com' })
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: 'seR 1' }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: 'ser 1',
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should match all results when filtering by text', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: ' S    r' }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: 's r',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should match no results when filtering by text', async () => {
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: '  not  found ' }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: 'not found',
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON([]),
    });
  });

  it('should not filter by text when textQuery is empty string', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: '' }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: '',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should not filter by text when textQuery is string made of spaces', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: '     ' }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: '',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should not filter by text when textQuery is null', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: null }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should not filter by text when textQuery is undefined', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: undefined }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should reject when textQuery is number', async () => {
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: 1 }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { textQuery: TextMessageOLD.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when textQuery is boolean', async () => {
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: true }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { textQuery: TextMessageOLD.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when textQuery is []', async () => {
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: [] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { textQuery: TextMessageOLD.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when textQuery is object', async () => {
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ textQuery: {} }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { textQuery: TextMessageOLD.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
