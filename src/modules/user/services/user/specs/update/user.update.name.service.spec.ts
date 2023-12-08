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

describe('UserService.update (name)', () => {
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

  async function insertUsers(
    ...users: {
      name: string;
      email: string;
      password: string;
      active?: boolean;
      roles: Role[];
    }[]
  ): Promise<string[]> {
    const ids = [];
    for (const user of users) {
      const ret = await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          name: user.name,
          email: user.email,
          hash: await encryptionService.encrypt(user.password),
          roles: user.roles,
          active: user.active,
        })
        .execute();
      ids.push(ret.identifiers[0].id);
    }
    return ids;
  }

  it('should accept when name has min allowed length', async () => {
    const [userId1, userId2] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: false,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    );
    const newName = 'x'.repeat(NAME_MIN_LENGTH);
    const expectedResults = [
      {
        name: newName,
        email: 'newemail@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    ];
    const ret = await userService.update(userId1, {
      name: newName,
      email: 'newemail@email.com',
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
    const [userId1, userId2] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: false,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    );
    // TODO: replace with insert
    const newName = 'x'.repeat(NAME_MAX_LENGTH);
    const expectedResults = [
      {
        name: newName,
        email: 'newemail@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    ];
    const ret = await userService.update(userId1, {
      name: newName,
      email: 'newemail@email.com',
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

  it('should accept when name is undefined', async () => {
    const [userId1, userId2] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: false,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    );
    const expectedResults = [
      {
        name: 'User 1',
        email: 'newemail@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    ];
    const ret = await userService.update(userId1, {
      name: undefined,
      email: 'newemail@email.com',
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

  it('should reject when name as shorter than allowed', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.update(userId1, { name: 'x'.repeat(NAME_MIN_LENGTH - 1) });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.MIN_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name as longer than allowed', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.update(userId1, { name: 'x'.repeat(NAME_MAX_LENGTH + 1) });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is null', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () => userService.update(userId1, { name: null });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is number', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.update(userId1, { name: 1 as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is boolean', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.update(userId1, { name: true as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is array', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.update(userId1, { name: [] as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is {}', async () => {
    const [userId1, user2] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.update(userId1, { name: {} as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
