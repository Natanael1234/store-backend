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
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { RoleMessage } from '../../../../enums/messages/role/role.messages.enum';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

describe('UserService.creat (roles)', () => {
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

  it('should accept when roles is [Role.ADMIN]', async () => {
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
    ];
    const ret = await userService.create({
      name: 'User name',
      email: 'user@email.com',
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

  it('should accept when roles is [Role.ROOT]', async () => {
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
    ];
    const ret = await userService.create({
      name: 'User name',
      email: 'user@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
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

  it('should accept when roles is [Role.USER]', async () => {
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.USER],
        active: true,
      },
    ];
    const ret = await userService.create({
      name: 'User name',
      email: 'user@email.com',
      password: 'Abc12*',
      roles: [Role.USER],
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

  it('should accept when multiple roles', async () => {
    const expectedResults = [
      {
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.USER, Role.ADMIN, Role.ROOT],
        active: true,
      },
    ];
    const ret = await userService.create({
      name: 'User name',
      email: 'user@email.com',
      password: 'Abc12*',
      roles: [Role.USER, Role.ADMIN, Role.ROOT],
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

  it('should reject when roles is null', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: null,
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.REQUIRED }, // TODO: should be RoleMessage.NULL
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is undefined', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: undefined,
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.REQUIRED }, // TODO: should be RoleMessage.REQUIRED
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is number', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: 1 as unknown as Role[],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is boolean', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: true as unknown as Role[],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is string', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: 'string' as unknown as Role[],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is object', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: {} as unknown as Role[],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is array containing invalid string', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: ['invalid'] as unknown as Role[],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is array containing number', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [1] as unknown as Role[],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is array containing boolean', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [true] as unknown as Role[],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is array containing array', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [[]] as unknown as Role[],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when roles is empty array', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [],
        active: true,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.getResponse()).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { roles: RoleMessage.MIN_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });
});
