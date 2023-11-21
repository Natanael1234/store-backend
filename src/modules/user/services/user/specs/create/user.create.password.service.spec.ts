import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import {
  testValidateUser,
  testValidateUsersWithPassword,
} from '../../../../../../test/user/test-user-utils';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../../../authentication/services/authentication/authentication.service';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { PasswordMessage } from '../../../../../system/messages/password/password.messages.enum';
import { TextMessage } from '../../../../../system/messages/text/text.messages';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } = UserConfigs;
const PasswordMessage2 = new TextMessage('password', {
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: PASSWORD_MAX_LENGTH,
});

describe('UserService.create (password)', () => {
  let module: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    module = await getTestingModule();
    userService = module.get<UserService>(UserService);
    authenticationService = module.get<AuthenticationService>(
      AuthenticationService,
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

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
    const ret = await userService.create({
      name: 'User name',
      email: 'user@email.com',
      password: password,
      roles: [Role.ADMIN],
      active: true,
    });
    testValidateUser(ret, expectedResults[0]);
    const users = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .getMany();
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
    const ret = await userService.create({
      name: 'User name',
      email: 'user@email.com',
      password: password,
      roles: [Role.ADMIN],
      active: true,
    });
    testValidateUser(ret, expectedResults[0]);
    const users = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .getMany();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should reject when password is shorter than allowed', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH - 4 - 1),
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage2.MIN_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is longer than allowed', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Ab1*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4 + 1),
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage2.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is null', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: null,
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage2.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is undefined', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: undefined,
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage2.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is number', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 1 as unknown as string,
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage2.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is boolean', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: true as unknown as string,
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage2.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is array', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: [] as unknown as string,
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage2.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is object', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: {} as unknown as string,
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage2.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is missing lowercase character', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is missing uppercase character', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'ABC12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is missing number character', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc***',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when password is missing special character', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc123',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { password: PasswordMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it.skip("should reject when hashed password doesn't matches sent password", async () => {});
});
