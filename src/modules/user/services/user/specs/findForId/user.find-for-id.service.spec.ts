import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import { testValidateUser } from '../../../../../../test/user/test-user-utils';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../../../authentication/services/authentication/authentication.service';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { UserMessage } from '../../../../enums/messages/user/user.messages.enum';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

describe('UserService.find (findForId)', () => {
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

  it('should get a single user', async () => {
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
        password: 'Cba12*',
        roles: [Role.ADMIN],
        active: false,
      },
    );

    const user = await userService.findForId(userId2);
    testValidateUser(user, {
      name: 'User 2',
      email: 'user2@email.com',
      roles: [Role.USER],
      active: false,
    });
  });

  it('should fail when user is not found', async () => {
    await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: true,
    });
    const fn = () =>
      userService.findForId('40e6215d-b5c6-4896-987c-f30f3678f608');
    await expect(fn()).rejects.toThrow(NotFoundException);
    await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
  });

  it('should fail when user id parameter is null', async () => {
    await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: true,
    });
    const fn = () => userService.findForId(null);
    await expect(fn()).rejects.toThrow(BadRequestException);
    await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
  });

  it('should fail when user id parameter is undefined', async () => {
    await insertUsers({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: true,
    });
    const fn = () => userService.findForId(undefined);
    await expect(fn()).rejects.toThrow(BadRequestException);
    await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
  });
});
