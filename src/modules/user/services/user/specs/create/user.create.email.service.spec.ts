import {
  ConflictException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
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
import { TextMessage } from '../../../../../system/messages/text/text.messages';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const { EMAIL_MAX_LENGTH } = UserConfigs;

const EmailMessage = new TextMessage('email', { maxLength: EMAIL_MAX_LENGTH });

describe('UserService.create (email)', () => {
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
    const ret = await userService.create({
      name: 'User name',
      email: email,
      password: 'Abc12*',
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

  it('should reject when email is longer than allowed', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'x'.repeat(EMAIL_MAX_LENGTH - 5 + 1) + '@e.co',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });

  it('should reject when email is null', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: null,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });

  it('should reject when email is undefined', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: undefined,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });

  it('should reject when email is number', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 1 as unknown as string,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });

  it('should reject when email is boolean', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: true as unknown as string,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });

  it('should reject when email is array', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: [] as unknown as string,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });

  it('should reject when email is object', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: {} as unknown as string,
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });

  it('should reject when email has invalid format', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'invalid',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });

  it('should fail if email is already in use', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
      ])
      .execute();
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User 3',
        email: 'user1@email.com', // email from already in use
        password: 'Cba12*',
        roles: [Role.ADMIN],
      });
    await expect(fn()).rejects.toThrow(ConflictException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.CONFLICT,
        message: EmailMessage.INVALID,
        statusCode: HttpStatus.CONFLICT,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });

  it('should fail if email is already in use by deleted user', async () => {
    const { identifiers: userIdentifiers } = await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
      ])
      .execute();
    await userRepo
      .createQueryBuilder(UserConstants.USERS)
      .softDelete()
      .from(User)
      .where(UserConstants.ID_EQUALS_TO, { userId: userIdentifiers[0].id })
      .execute();
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User 3',
        email: 'user1@email.com', // email from deleted user
        password: 'Cba12*',
        roles: [Role.ADMIN],
      });
    await expect(fn()).rejects.toThrow(ConflictException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.CONFLICT,
        message: EmailMessage.INVALID,
        statusCode: HttpStatus.CONFLICT,
      });
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      expect(usersAfter).toEqual(usersBefore);
    }
  });
});
