import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../../../authentication/services/authentication/authentication.service';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { UserMessage } from '../../../../enums/messages/user/user.messages.enum';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

describe('UserService.update (userId)', () => {
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

  it('should reject when user does not exists', async () => {
    const newName = 'New Name';
    const newEmail = 'newname@email.com';
    await insertUsers(
      {
        name: 'User 1',
        password: 'Abc12*',
        email: 'user1@email.com',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.USER],
        active: false,
      },
    );
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const uuid = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
    async function fn() {
      await userService.update(uuid, {
        name: newName,
        email: newEmail,
        // roles: [Role.ADMIN],
      });
    }
    await expect(fn()).rejects.toThrow(NotFoundException);
    expect(usersBefore).toEqual(
      await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
    );
    await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
  });

  it('should reject when userId is null', async () => {
    await insertUsers(
      {
        name: 'User 1',
        password: 'Abc12*',
        email: 'user1@email.com',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.USER],
        active: false,
      },
      {
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.ADMIN],
      },
    );
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    async function fn() {
      await userService.findForId(null);
    }
    await expect(fn()).rejects.toThrow(BadRequestException);
    expect(usersBefore).toEqual(
      await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
    );
    await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
  });

  it('should reject when user id is undefined', async () => {
    await insertUsers(
      {
        name: 'User 1',
        password: 'Abc12*',
        email: 'user1@email.com',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.USER],
        active: false,
      },
      {
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.ADMIN],
      },
    );
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .getMany();
    const fn = async () => await userService.findForId(undefined);
    await expect(fn()).rejects.toThrow(BadRequestException);
    expect(usersBefore).toEqual(
      await userRepo.createQueryBuilder(UserConstants.USER).getMany(),
    );
    await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
  });

  it(`should reject when userId is boolean`, async () => {
    const fn = () =>
      userService.update(true as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(UserMessage.INVALID_USER_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when userId is number`, async () => {
    const fn = () =>
      userService.update(1 as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(UserMessage.INVALID_USER_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when userId is invalid string`, async () => {
    const fn = () =>
      userService.update('not-a-valid-uuid', { name: 'New Name' });
    await expect(fn()).rejects.toThrow(UserMessage.INVALID_USER_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when userId is array`, async () => {
    const fn = () =>
      userService.update([] as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(UserMessage.INVALID_USER_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when userId is object`, async () => {
    const fn = () =>
      userService.update({} as unknown as string, { name: 'New Name' });
    await expect(fn()).rejects.toThrow(UserMessage.INVALID_USER_ID);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
  });

  it(`should reject when userId is not found`, async () => {
    const fn = () =>
      userService.update('550e8400-e29b-41d4-a716-446655440000', {
        name: 'New Name',
      });
    await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
    await expect(fn()).rejects.toThrow(NotFoundException);
  });
});
