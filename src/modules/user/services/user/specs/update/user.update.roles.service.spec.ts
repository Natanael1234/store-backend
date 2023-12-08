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
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

describe('UserService.update (roles)', () => {
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

  it('should not update roles', async () => {
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
        name: 'New User Name',
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
      name: 'New User Name',
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
});
