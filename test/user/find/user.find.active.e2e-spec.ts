import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../src/modules/authentication/services/authentication/authentication.service';
import { PaginationConfigs } from '../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { ActiveFilter } from '../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { testInsertUsers } from '../../../src/test/user/test-user-utils';
import { objectToJSON } from '../../common/instance-to-json';
import { testGetMin } from '../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');

describe('UserController (e2e) - get /users (active)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let authenticationService: AuthenticationService;
  let encryptionService: EncryptionService;
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
    encryptionService = module.get<EncryptionService>(EncryptionService);
    authenticationService = module.get<AuthenticationService>(
      AuthenticationService,
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function createTestAcceptScenario() {
    const usersData = [
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: false,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Cba12*',
        roles: [Role.USER],
        active: false,
      },
    ];
    await testInsertUsers(userRepo, encryptionService, usersData);
    const retLogin = await authenticationService.login({
      email: 'user2@email.com',
      password: 'Xyz12*',
    });
    rootToken = retLogin.data.payload.token;
  }

  it('should retrieve active and inactive users when active = "all"', async () => {
    await createTestAcceptScenario();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: ActiveFilter.ALL }) },
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

  it('should retrieve inactive users when active = "inactive"', async () => {
    await createTestAcceptScenario();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: false })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: ActiveFilter.INACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should retrieve active users when active = "active"', async () => {
    await createTestAcceptScenario();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: ActiveFilter.ACTIVE }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should retrieve active users when active = null ', async () => {
    await createTestAcceptScenario();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: null }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should filter when active = undefined', async () => {
    await createTestAcceptScenario();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: undefined }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should reject when active is number', async () => {
    await createTestAcceptScenario();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: 1 }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is boolean', async () => {
    await createTestAcceptScenario();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: true }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is array', async () => {
    await createTestAcceptScenario();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: [] }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is object', async () => {
    await createTestAcceptScenario();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: {} }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is invalid string', async () => {
    await createTestAcceptScenario();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ active: 'invalid' }) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
