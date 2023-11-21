import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { PasswordMessage } from '../../../src/modules/system/messages/password/password.messages.enum';
import { TextMessage } from '../../../src/modules/system/messages/text/text.messages';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
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

const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } = UserConfigs;
const PasswordMessage2 = new TextMessage('password', {
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: PASSWORD_MAX_LENGTH,
});

describe('UserController (e2e) - post /users (password)', () => {
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

  it('should accept when password has minimum allowed length', async () => {
    const password = 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH); // TODO: evitar sequências de caracteres
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: password,
        roles: [Role.ADMIN],
        active: true,
      },
    ];
    const ret = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: password,
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.CREATED,
    );
    testValidateUser(ret, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when password has maximum allowed length', async () => {
    const password = 'Ab1*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4);
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: password,
        roles: [Role.ADMIN],
        active: true,
      },
    ];
    const ret = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: password,
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.CREATED,
    );
    testValidateUser(ret, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should reject when password is shorter than allowed', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH - 4 - 1),
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.MIN_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is longer than allowed', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Ab1*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4 + 1),
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is null', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: null,
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is undefined', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: undefined,
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.REQUIRED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is number', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 1 as unknown as string,
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is boolean', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: true as unknown as string,
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is array', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: [] as unknown as string,
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is object', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: {} as unknown as string,
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is missing lowercase character', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is missing uppercase character', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'ABC12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is missing number character', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc***',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when password is missing special character', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc123',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it.skip("should reject when hashed password doesn't matches sent password", async () => {});
});
