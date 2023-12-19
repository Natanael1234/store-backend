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
import { SortConstants } from '../../../../../system/constants/sort/sort.constants';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../system/messages/text/text.messages';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const EmailMessage = new TextMessage('email', {
  maxLength: UserConfigs.EMAIL_MAX_LENGTH,
});

describe('UserService.update (email)', () => {
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

  async function getUsers() {
    return userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .getMany();
  }

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

  it('should accept when email has valid format', async () => {
    const [userId1, userId2] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
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
    );
    const newEmail = `user1b@email.com`;
    const expectedResults = [
      {
        name: 'User 1',
        email: newEmail,
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
    const ret = await userService.update(userId1, { email: newEmail });
    testValidateUser(ret, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when email has max allowed length', async () => {
    const [userId1, userId2] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
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
    );
    const newEmail = `user1${'b'.repeat(
      UserConfigs.EMAIL_MAX_LENGTH - 10,
    )}@e.co`;
    const expectedResults = [
      {
        name: 'User 1',
        email: newEmail,
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
    const ret = await userService.update(userId1, { email: newEmail });
    testValidateUser(ret, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when email is undefined', async () => {
    const [userId1, userId2] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
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
    );

    const expectedResults = [
      {
        name: 'User 1b',
        email: 'user1@email.com',
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
      name: 'User 1b',
      email: undefined,
    });
    testValidateUser(ret, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should reject when email has invalid format', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const fn = () => userService.update(userId1, { email: 'invalid' });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when email is longer than allowed', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const fn = () =>
      userService.update(userId1, {
        email: 'x'.repeat(UserConfigs.EMAIL_MAX_LENGTH - 5 + 1) + '@e.co',
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when email is null', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const fn = () => userService.update(userId1, { email: null });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when email is number', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const fn = () =>
      userService.update(userId1, { email: 1 as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when email is boolean', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const fn = () =>
      userService.update(userId1, { email: true as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when email is array', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const fn = () =>
      userService.update(userId1, { email: [] as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when email is {}', async () => {
    const [userId1] = await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const fn = () =>
      userService.update(userId1, { email: {} as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { email: EmailMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when email is already in use', async () => {
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

    const brandsBefore = await getUsers();
    const fn = () =>
      userService.update(userId1, {
        name: 'New User Name',
        email: 'user2@email.com',
        active: false,
      });
    await expect(fn()).rejects.toThrow(ConflictException);
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.CONFLICT,
        message: EmailMessage.INVALID,
        statusCode: HttpStatus.CONFLICT,
      });
    }
  });

  it.skip('should ivalidate refresh tokens if change email', async () => {});
});
