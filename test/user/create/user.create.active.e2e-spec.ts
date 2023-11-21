import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { BoolMessage } from '../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { User } from '../../../src/modules/user/models/user/user.entity';
import {
  testValidateUser,
  testValidateUsersWithPassword,
} from '../../../src/test/user/test-user-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');

describe('UserController (e2e) - post /users (active)', () => {
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

  it('should accept when active is true', async () => {
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
    ];
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
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

  it('should accept when active is false', async () => {
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: false,
      },
    ];
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: false,
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

  it('should accept when active is undefined', async () => {
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: false,
      },
    ];
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: undefined,
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

  it('should reject when active is null', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: null,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when active is number', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: 1 as unknown as boolean,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when active is string', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: 'true' as unknown as boolean,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when active is array', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: [] as unknown as boolean,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when active is object', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: {} as unknown as boolean,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });
});
