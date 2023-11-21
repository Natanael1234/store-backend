import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { RoleMessage } from '../../../src/modules/user/enums/messages/role/role.messages.enum';
import { User } from '../../../src/modules/user/models/user/user.entity';
import {
  testValidateUser,
  testValidateUsersWithPassword,
} from '../../../src/test/user/test-user-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - post /users (roles)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = moduleFixture.get<EncryptionService>(EncryptionService);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
  });

  async function getUsers() {
    return await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .skip(3)
      .getMany();
  }

  it('should accept when roles is [Role.ADMIN]', async () => {
    const expectedResults = [
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
    ];
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.CREATED,
    );
    testValidateUser(response, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when roles is [Role.ROOT]', async () => {
    const expectedResults = [
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
    ];
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      rootToken,
      HttpStatus.CREATED,
    );
    testValidateUser(response, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when roles is [Role.USER]', async () => {
    const expectedResults = [
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.USER],
        active: true,
      },
    ];
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.USER],
        active: true,
      },
      rootToken,
      HttpStatus.CREATED,
    );
    testValidateUser(response, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when multiple roles', async () => {
    const expectedResults = [
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.USER, Role.ADMIN, Role.ROOT],
        active: true,
      },
    ];
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.USER, Role.ADMIN, Role.ROOT],
        active: true,
      },
      rootToken,
      HttpStatus.CREATED,
    );
    testValidateUser(response, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should reject when roles is null', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: null,
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.REQUIRED }, // TODO: should be RoleMessage.NULL
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is undefined', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: undefined,
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.REQUIRED }, // TODO: should be RoleMessage.REQUIRED
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is number', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: 1 as unknown as Role[],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is boolean', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: true as unknown as Role[],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is invalid string', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: 'invalid' as unknown as Role[],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is object', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: {} as unknown as Role[],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is array containing invalid string', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: ['invalid'] as unknown as Role[],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is array containing number', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [1] as unknown as Role[],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is array containing boolean', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [true] as unknown as Role[],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is array containing array', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [[]] as unknown as Role[],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when roles is empty array', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { roles: RoleMessage.MIN_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });
});
