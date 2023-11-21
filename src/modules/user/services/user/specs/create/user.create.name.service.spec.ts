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
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../system/messages/text/text.messages';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const { NAME_MAX_LENGTH, NAME_MIN_LENGTH } = UserConfigs;

const NameMessage = new TextMessage('name', {
  minLength: NAME_MIN_LENGTH,
  maxLength: NAME_MAX_LENGTH,
});

describe('UserService.create (name)', () => {
  let module: TestingModule;
  let userService: UserService;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    module = await getTestingModule();
    userService = module.get<UserService>(UserService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

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
    const ret = await userService.create({
      name: name,
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
    const ret = await userService.create({
      name: name,
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

  it('should reject when name is shorter than allowed', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();

    const fn = () =>
      userService.create({
        name: 'x'.repeat(NAME_MIN_LENGTH - 1),
        email: 'user@email.com',
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
        message: { name: NameMessage.MIN_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when name is longer than allowed', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 'x'.repeat(NAME_MAX_LENGTH + 1),
        email: 'user@email.com',
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
        message: { name: NameMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when name is null', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: null,
        email: 'user@email.com',
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
        message: { name: NameMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when name is undefined', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: undefined,
        email: 'user@email.com',
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
        message: { name: NameMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when name is number', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: 1 as unknown as string,
        email: 'user@email.com',
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
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when name is boolean', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: true as unknown as string,
        email: 'user@email.com',
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
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when name is array', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: [] as unknown as string,
        email: 'user@email.com',
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
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });

  it('should reject when name is object', async () => {
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.create({
        name: {} as unknown as string,
        email: 'user@email.com',
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
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
      expect(
        await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
      ).toEqual(usersBefore);
    }
  });
});
