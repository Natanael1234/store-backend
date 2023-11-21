import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
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

const { EMAIL_MAX_LENGTH } = UserConfigs;

const EmailMessage = new TextMessage('email', { maxLength: EMAIL_MAX_LENGTH });

describe('UserController (e2e) - post /users (email)', () => {
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

  it('should accept when email has max allowed length', async () => {
    const email = 'x'.repeat(EMAIL_MAX_LENGTH - 5) + '@e.co';
    const expectedResults = [
      {
        name: 'User name',
        email: email,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
    ];
    const ret = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: email,
        password: 'Abc12*',
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

  it('should reject when email is longer than allowed', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'x'.repeat(EMAIL_MAX_LENGTH - 5 + 1) + '@e.co',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when email is null', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: null,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when email is undefined', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: undefined,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.REQUIRED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when email is number', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 1 as unknown as string,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when email is boolean', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: true as unknown as string,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when email is array', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: [] as unknown as string,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when email is object', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: {} as unknown as string,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when email has invalid format', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User name',
        email: 'invalid',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should fail if email is already in use', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 4',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
      ])
      .execute();
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 5',
        email: 'user4@email.com', // email from already in use
        password: 'Cba12*',
        roles: [Role.ADMIN],
      },
      rootToken,
      HttpStatus.CONFLICT,
    );
    expect(response).toEqual({
      error: ExceptionText.CONFLICT,
      message: EmailMessage.INVALID,
      statusCode: HttpStatus.CONFLICT,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should fail if email is already in use by deleted user', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 4',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
          deletedAt: new Date(),
        },
      ])
      .execute();
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'User 5',
        email: 'user4@email.com', // email from deleted user
        password: 'Cba12*',
        roles: [Role.ADMIN],
      },
      rootToken,
      HttpStatus.CONFLICT,
    );
    expect(response).toEqual({
      error: ExceptionText.CONFLICT,
      message: EmailMessage.INVALID,
      statusCode: HttpStatus.CONFLICT,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });
});
