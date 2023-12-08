import { BadRequestException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import {
  testValidateUsers,
  testValidateUsersWithPassword,
} from '../../../../../../test/user/test-user-utils';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../../../authentication/services/authentication/authentication.service';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { UserMessage } from '../../../../enums/messages/user/user.messages.enum';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

describe('UserService.create (main)', () => {
  let module: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;

  const { EMAIL_MAX_LENGTH } = UserConfigs;

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

  it('should create users', async () => {
    const createdUsers = [
      await userService.create({
        name: 'User 1',
        password: 'Abc12*',
        email: 'user1@email.com',
        roles: [Role.ROOT],
        active: true,
      }),
      await userService.create({
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.USER],
        active: false,
      }),
      await userService.create({
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.ADMIN],
      }),
    ];

    const expectedData = [
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
        password: 'Cba12*',
        roles: [Role.ADMIN],
        active: false,
      },
    ];

    testValidateUsers(createdUsers, expectedData);

    const users = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .getMany();

    await testValidateUsersWithPassword(users, expectedData, encryptionService);
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
