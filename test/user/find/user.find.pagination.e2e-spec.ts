import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { PaginationConfigs } from '../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { testInsertUsers } from '../../../src/test/user/test-user-utils';
import { objectToJSON } from '../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - get /users (pagination)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;
  let rootToken: string;
  const count = 15;

  async function createTestScenario() {
    const startNumber = 4; // already created 3 user for login
    const quantity = 12;
    const data = [];
    for (let i = 0; i < quantity; i++) {
      const num = i + startNumber;
      data.push({
        name: `User ${num}`,
        email: `user${num}@email.com`,
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      });
    }
    return testInsertUsers(userRepo, encryptionService, data);
  }

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = moduleFixture.get<EncryptionService>(EncryptionService);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
    await createTestScenario();
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
  });

  it('should paginate without sending pagination params', async () => {
    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    let response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should paginate when params is empty', async () => {
    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    let response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should paginate when params contains valid paramaters', async () => {
    const page = 2;
    const pageSize = 3;
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    let response = await testGetMin(
      app,
      '/users',
      { query: JSON.stringify({ page, pageSize }) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  // page

  describe('page', () => {
    it('should paginate when page is minimum allowed', async () => {
      const page = PaginationConfigs.MIN_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when page is greater than allowed', async () => {
      const page = PaginationConfigs.MIN_PAGE + 1;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when page is very great', async () => {
      const page = PaginationConfigs.MIN_PAGE + 1000;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate using default page when page is null', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page: null }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate using default page when page is undefined', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is float', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page: 1.1 }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is boolean', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page: true }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is object', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page: {} }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is array', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page: [] }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default page when page is string', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ page: '1' }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });
  });

  // pageSize

  describe('pageSize', () => {
    it('should paginate when pageSize is minimum allowed', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ pageSize }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is smaller than allowed', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
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
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is maximum allowed', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ pageSize }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate using maximum pageSize when pageSize is greater than allowed', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
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
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is null', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        {
          query: JSON.stringify({ pageSize: null }),
        },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should paginate when pageSize is undefined', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ pageSize: undefined }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is float', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
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
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is boolean', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ pageSize: true }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is object', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ pageSize: {} }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is array', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ pageSize: {} }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });

    it('should use default pageSize when pageSize is string', async () => {
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      let response = await testGetMin(
        app,
        '/users',
        { query: JSON.stringify({ pageSize: '1' }) },
        rootToken,
        HttpStatus.OK,
      );
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: objectToJSON(regs),
      });
    });
  });
});
