import {
  BadRequestException,
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
import { BoolMessage } from '../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../system/messages/text/text.messages';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { UserMessage } from '../../../../enums/messages/user/user.messages.enum';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, NAME_MIN_LENGTH } = UserConfigs;

const NameMessage = new TextMessage('name', {
  minLength: NAME_MIN_LENGTH,
  maxLength: NAME_MAX_LENGTH,
});

const EmailMessage = new TextMessage('email', {
  maxLength: EMAIL_MAX_LENGTH,
});
2;
const ActiveMessage = new BoolMessage('active');

describe('UserService.update (main)', () => {
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

  it('should update user', async () => {
    const [userId1, userId2, userId3] = await insertUsers(
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
      {
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Xyz34*',
        roles: [Role.ADMIN],
        active: false,
      },
    );
    const expectedResults = [
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'New Name',
        email: 'newname@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: true,
      },
      {
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Xyz34*',
        roles: [Role.ADMIN],
        active: false,
      },
    ];
    const ret = await userService.update(userId2, {
      name: 'New Name',
      email: 'newname@email.com',
      active: true,
    });
    await testValidateUser(ret, expectedResults[1]);
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

  it('should reject when there are multiple invalid fields', async () => {
    const [userId1, userId2, userId3] = await insertUsers(
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
    const brandsBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = () =>
      userService.update(userId1, {
        name: null,
        email: 'invalid',
        active: 1 as unknown as boolean,
      });
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
        message: {
          name: NameMessage.NULL,
          email: EmailMessage.INVALID,
          active: ActiveMessage.INVALID,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should fail when user data is null', async () => {
    const fn = () => userService.create(null);
    await expect(fn()).rejects.toThrow(UserMessage.DATA_REQUIRED);
    await expect(fn()).rejects.toThrow(BadRequestException);
  });

  it('should fail when user data is undefined', async () => {
    const fn = () => userService.create(undefined);
    await expect(fn()).rejects.toThrow(UserMessage.DATA_REQUIRED);
    await expect(fn()).rejects.toThrow(BadRequestException);
  });
});
