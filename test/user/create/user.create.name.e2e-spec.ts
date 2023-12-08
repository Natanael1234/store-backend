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

import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testValidateUser,
  testValidateUsersWithPassword,
} from '../../../src/test/user/test-user-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../utils/test-end-to-end.utils';

const { NAME_MAX_LENGTH, NAME_MIN_LENGTH } = UserConfigs;

const NameMessage = new TextMessage('name', {
  minLength: NAME_MIN_LENGTH,
  maxLength: NAME_MAX_LENGTH,
});

describe('UserController (e2e) - post /users (name)', () => {
  let app: INestApplication;
  let module: TestingModule;
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
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function getUsers() {
    return await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .skip(3)
      .getMany();
  }

  it('should accept when name has min allowed length', async () => {
    const name = 'x'.repeat(NAME_MIN_LENGTH);
    const expectedResults = [
      {
        name: name,
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
    ];
    const ret = await testPostMin(
      app,
      '/users',
      {
        name: name,
        email: 'user@email.com',
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

  it('should accept when name has max allowed length', async () => {
    const name = 'x'.repeat(NAME_MAX_LENGTH);
    const expectedResults = [
      {
        name: name,
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
    ];
    const ret = await testPostMin(
      app,
      '/users',
      {
        name: name,
        email: 'user@email.com',
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

  it('should reject when name is shorter than allowed', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'x'.repeat(NAME_MIN_LENGTH - 1),
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MIN_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when name is longer than allowed', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 'x'.repeat(NAME_MAX_LENGTH + 1),
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when name is null', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: null,
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when name is undefined', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: undefined,
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.REQUIRED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when name is number', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: 1 as unknown as string,
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when name is boolean', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: true as unknown as string,
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is array', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: [] as unknown as string,
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });

  it('should reject when name is object', async () => {
    const usersBefore = await getUsers();
    const response = await testPostMin(
      app,
      '/users',
      {
        name: {} as unknown as string,
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });
});
