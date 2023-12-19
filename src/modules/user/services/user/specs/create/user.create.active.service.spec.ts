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
import { BoolMessage } from '../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const ActiveMessage = new BoolMessage('active');

describe('UserService.create (active)', () => {
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

  it('should accept when active is true', async () => {
    const ret = await userService.create({
      name: 'User name',
      email: 'user@email.com',
      password: 'Abc12*',
      roles: [Role.ADMIN],
      active: true,
    });
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
    ];
    await testValidateUser(ret, expectedResults[0]);
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

  it('should accept when active is false', async () => {
    const ret = await userService.create({
      name: 'User name',
      email: 'user@email.com',
      password: 'Abc12*',
      roles: [Role.ADMIN],
      active: false,
    });
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: false,
      },
    ];
    await testValidateUser(ret, expectedResults[0]);
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
    const ret = await userService.create({
      name: 'User name',
      email: 'user@email.com',
      password: 'Abc12*',
      roles: [Role.ADMIN],
      active: undefined,
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

  it('should reject when active is null', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: null,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when active is number', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: 1 as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when active is string', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: 'true' as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when active is array', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: [] as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when active is object', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: {} as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });
});
