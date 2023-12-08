import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { PasswordMessage as PasswordMessage2 } from '../../../src/modules/system/messages/password/password.messages.enum';
import { TextMessage } from '../../../src/modules/system/messages/text/text.messages';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { testValidateUsersWithPassword } from '../../../src/test/user/test-user-utils';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../utils/test-end-to-end.utils';

const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } = UserConfigs;

const PasswordMessage = new TextMessage('password', {
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: PASSWORD_MAX_LENGTH,
});

describe('UserController (e2e) - patch /users/password (password)', () => {
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

  async function findUsers() {
    return await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .getMany();
  }

  it('should accept when password has minimum allowed length', async () => {
    const newPassword = 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH - 4);
    const expectedResults = [
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: newPassword,
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.ADMIN],
        active: true,
      },
      {
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.USER],
        active: true,
      },
    ];
    const ret = await testPatchMin(
      app,
      `/users/password`,
      { password: newPassword },
      rootToken,
      HttpStatus.OK,
    );
    expect(ret).toEqual({ status: 'success' });
    const users = await findUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when password has maximum allowed length', async () => {
    const newPassword = 'Ab1*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4);
    const expectedResults = [
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: newPassword,
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.ADMIN],
        active: true,
      },
      {
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.USER],
        active: true,
      },
    ];
    const ret = await testPatchMin(
      app,
      `/users/password`,
      { password: newPassword },
      rootToken,
      HttpStatus.OK,
    );
    expect(ret).toEqual({ status: 'success' });
    const users = await findUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should reject when password shorter than allowed', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH - 4 - 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.MIN_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password longer than allowed', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: 'Ab1*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4 + 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password is null', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password is undefined', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: undefined },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.REQUIRED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password is number', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password is boolean', async () => {
    const usersBefore = await findUsers();

    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password is array', async () => {
    const usersBefore = await findUsers();

    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password is object', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password do not contains an lowwercase character', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: 'ABC12*' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password do not contains an uppercase character', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: 'abc12*' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password do not contains an number character', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: 'abcAB*' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });

  it('should reject when password do not contains an special character', async () => {
    const usersBefore = await findUsers();
    const response = await testPatchMin(
      app,
      `/users/password`,
      { password: 'abc123' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const usersAfter = await findUsers();
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { password: PasswordMessage2.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(usersAfter).toStrictEqual(usersBefore);
  });
});
