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
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { UserOrder } from '../../../src/modules/user/enums/sort/user-order/user-order.enum';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { testInsertUsers } from '../../../src/test/user/test-user-utils';
import { objectToJSON } from '../../common/instance-to-json';
import { testGetMin } from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - get /users (orderBy)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let authenticationService: AuthenticationService;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;
  let rootToken: string;

  async function createTestScenario() {
    const userData = [
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 1',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
      {
        name: 'User 2',
        email: 'user3@email.com',
        password: 'Cba12*',
        roles: [Role.ADMIN],
        active: true,
      },
      {
        name: 'User 2',
        email: 'user4@email.com',
        password: 'Cba12*',
        roles: [Role.ADMIN],
        active: false,
      },
    ];
    await testInsertUsers(userRepo, encryptionService, userData);
    const retLogin = await authenticationService.login({
      email: userData[0].email,
      password: userData[0].password,
    });
    rootToken = retLogin.data.payload.token;
  }

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
    await createTestScenario();
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should order by ["name_asc", "active_asc"]', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      {
        query: JSON.stringify({
          orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_ASC],
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
      orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
    });
  });

  it('should order by ["name_asc", "active_desc"]', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      {
        query: JSON.stringify({
          orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_DESC],
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
      orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_DESC],
      results: objectToJSON(regs),
    });
  });

  it('should order by ["name_desc", "active_asc"]', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.DESC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      {
        query: JSON.stringify({
          orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
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
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
      results: objectToJSON(regs),
    });
  });

  it('should order by ["name_desc", "active_desc"]', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.DESC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      {
        query: JSON.stringify({
          orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_DESC],
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
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_DESC],
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is null', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: null, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is undefined', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
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
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is string', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: '[]', active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains repeated column', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
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
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is number', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
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
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is number', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: 1, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is boolean', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: true, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is array', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: [], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy is object', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: {}, active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid string item', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
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
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid number item', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: [1], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid boolean item', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: [true], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid array item', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: [[]], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should use default order when orderBy contains invalid object item', async () => {
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ orderBy: [{}], active: ActiveFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });
});
