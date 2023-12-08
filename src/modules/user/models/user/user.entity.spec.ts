import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import {
  testValidateUserWithPassword,
  testValidateUsersWithPassword,
} from '../../../../test/user/test-user-utils';
import { Role } from '../../../authentication/enums/role/role.enum';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { UserConstants } from '../../constants/user/user-entity.constants';
import { User } from './user.entity';

describe('User entity', () => {
  let module: TestingModule;
  let userRepo: Repository<User>;
  let encryptionService: EncryptionService;

  async function insertUsers(
    ...users: {
      name: string;
      email: string;
      password: string;
      active?: boolean;
      roles: Role[];
    }[]
  ) {
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

  beforeEach(async () => {
    module = await getTestingModule();
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('create', () => {
    it('should insert users', async () => {
      await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abcd*1',
          roles: [Role.ADMIN, Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abcd*2',
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abcd*3',
          roles: [Role.ADMIN],
        },
      );
      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();
      await testValidateUsersWithPassword(
        users,
        [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abcd*1',
            roles: [Role.ADMIN, Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Abcd*2',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Abcd*3',
            roles: [Role.ADMIN],
            active: false,
          },
        ],
        encryptionService,
      );
    });

    it('should not insert an user with empty name', async () => {
      const fn = async () =>
        userRepo
          .createQueryBuilder()
          .insert()
          .into(User)
          .values([
            {
              name: undefined,
              email: 'user1@email.com',
              hash: await encryptionService.encrypt('Abcd*1'),
              roles: [Role.ADMIN],
              active: true,
            },
          ])
          .execute();
      await expect(fn()).rejects.toThrow(QueryFailedError);
      await expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.name',
      );
    });

    it('should not insert an user with empty email', async () => {
      const fn = async () =>
        userRepo
          .createQueryBuilder()
          .insert()
          .into(User)
          .values([
            {
              name: 'User 1',
              hash: await encryptionService.encrypt('Abcd*1'),
              roles: [Role.ADMIN],
              active: true,
            },
          ])
          .execute();
      await expect(fn()).rejects.toThrow(QueryFailedError);
      await expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.email',
      );
    });

    it('should not insert an user with empty hash', async () => {
      const fn = async () =>
        userRepo
          .createQueryBuilder()
          .insert()
          .into(User)
          .values([
            {
              name: 'User 1',
              email: 'user1@email.com',
              roles: [Role.ADMIN],
              active: true,
            },
          ])
          .execute();
      await expect(fn()).rejects.toThrow(QueryFailedError);
      await expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.hash',
      );
    });

    it('should not insert an user with duplicated email', async () => {
      await insertUsers({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abcd*1',
        roles: [Role.ADMIN],
        active: true,
      });
      const fn = async () =>
        userRepo
          .createQueryBuilder()
          .insert()
          .into(User)
          .values([
            {
              name: 'User 2',
              email: 'user1@email.com',
              hash: await encryptionService.encrypt('Abcd*1'),
              roles: [Role.ADMIN],
              active: true,
            },
          ])
          .execute();
      await expect(fn()).rejects.toThrow(QueryFailedError);
      await expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email',
      );
    });

    it('should not insert an user with null role', async () => {
      const fn = async () =>
        userRepo
          .createQueryBuilder()
          .insert()
          .into(User)
          .values([
            {
              name: 'User 2',
              email: 'user1@email.com',
              hash: await encryptionService.encrypt('Abcd*1'),
              roles: null,
              active: true,
            },
          ])
          .execute();
      await expect(fn()).rejects.toThrow(QueryFailedError);
      await expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.role',
      );
    });

    it('should not insert an user with undefined role', async () => {
      const fn = async () =>
        userRepo
          .createQueryBuilder()
          .insert()
          .into(User)
          .values({
            name: 'User',
            email: 'user1@email.com',
            hash: await encryptionService.encrypt('Abcd*1'),
            roles: undefined,
            active: true,
          })
          .execute();
      await expect(fn()).rejects.toThrow(QueryFailedError);
      await expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.role',
      );
    });
  });

  describe('find', () => {
    it('should find users', async () => {
      await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abcd*1',
          roles: [Role.ADMIN, Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abcd*2',
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abcd*3',
          roles: [Role.ADMIN],
        },
      );
      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();
      await testValidateUsersWithPassword(
        users,
        [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abcd*1',
            roles: [Role.ADMIN, Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Abcd*2',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Abcd*3',
            roles: [Role.ADMIN],
            active: false,
          },
        ],
        encryptionService,
      );
    });
  });

  describe('find one', () => {
    it('should find one user by id', async () => {
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abcd*1',
          active: true,
          roles: [Role.ADMIN, Role.ROOT],
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abcd*2',
          active: false,
          roles: [Role.USER],
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abcd*3',
          roles: [Role.ADMIN],
        },
      );
      await userRepo.createQueryBuilder().insert().into(User).values([]);
      const user = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .where(UserConstants.USER_ID_EQUALS_TO, { userId: userId2 })
        .getOne();
      await testValidateUserWithPassword(
        user,
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abcd*2',
          active: false,
          roles: [Role.USER],
        },
        encryptionService,
      );
    });
  });

  describe('soft delete', () => {
    it('should soft delete an user', async () => {
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abcd*1',
          roles: [Role.ADMIN, Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abcd*2',
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abcd*3',
          roles: [Role.ADMIN],
        },
      );
      const deleteReturn = await userRepo
        .createQueryBuilder(UserConstants.USERS)
        .softDelete()
        .where(UserConstants.ID_EQUALS_TO, { userId: userId2 })
        .execute();
      expect(deleteReturn?.affected).toEqual(1);
      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .withDeleted()
        .getMany();
      await testValidateUsersWithPassword(
        users,
        [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abcd*1',
            active: true,
            roles: [Role.ADMIN, Role.ROOT],
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Abcd*2',
            active: false,
            roles: [Role.USER],
            deleted: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Abcd*3',
            roles: [Role.ADMIN],
            active: false,
          },
        ],
        encryptionService,
      );
    });
  });

  describe('update', () => {
    it('should update an user', async () => {
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abcd*1',
          active: true,
          roles: [Role.ADMIN, Role.ROOT],
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abcd*2',
          active: false,
          roles: [Role.USER],
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abcd*3',
          roles: [Role.ADMIN],
        },
      );
      const updateUser = await userRepo
        .createQueryBuilder()
        .update(User)
        .set({
          name: 'User 2 updated',
          email: 'user2updated@gmail.com',
          hash: await encryptionService.encrypt('Abcd*4'),
          roles: [Role.ADMIN],
          active: true,
        })
        .where(UserConstants.ID_EQUALS_TO, { userId: userId2 })
        .execute();
      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();
      expect(users).toHaveLength(3);
      await testValidateUsersWithPassword(
        users,
        [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abcd*1',
            active: true,
            roles: [Role.ADMIN, Role.ROOT],
          },
          {
            name: 'User 2 updated',
            email: 'user2updated@gmail.com',
            password: 'Abcd*4',
            roles: [Role.ADMIN],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Abcd*3',
            roles: [Role.ADMIN],
            active: false,
          },
        ],
        encryptionService,
      );
    });

    it('should update an user with empty name', async () => {
      const [userId] = await insertUsers({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abcd*1',
        active: true,
        roles: [Role.ADMIN, Role.ROOT],
      });

      const fn = async () => {
        await userRepo.update(userId, {
          email: 'user@email.com',
          hash: await encryptionService.encrypt('Abcd*2'),
          roles: [Role.ADMIN],
          active: true,
        });
      };
      await expect(fn()).resolves.not.toThrowError();
    });

    it('should update an user with empty email', async () => {
      const [userId] = await insertUsers({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abcd*1',
        active: true,
        roles: [Role.ADMIN, Role.ROOT],
      });
      const fn = async () => {
        userRepo.update(userId, {
          name: 'User',
          email: undefined,
          hash: await encryptionService.encrypt('Abcd*2'),
          roles: [Role.ADMIN],
          active: true,
        });
      };
      await expect(fn()).resolves.not.toThrowError();
    });

    it('should update an user with empty hash', async () => {
      const [userId] = await insertUsers({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abcd*1',
        active: true,
        roles: [Role.ADMIN, Role.ROOT],
      });
      const fn = async () => {
        userRepo.update(userId, {
          name: 'User',
          email: 'user@email.com',
          roles: [Role.ADMIN],
          hash: undefined,
          active: true,
        });
      };
      await expect(fn()).resolves.not.toThrowError();
    });

    it('should update an user with empty active', async () => {
      const [userId] = await insertUsers({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abcd*1',
        active: true,
        roles: [Role.ADMIN, Role.ROOT],
      });
      const fn = async () => {
        userRepo.createQueryBuilder().update(userId, {
          name: 'User',
          email: await encryptionService.encrypt('user@email.com'),
          password: 'Abcd*2',
          roles: [Role.ADMIN],
        });
      };
      await expect(fn()).resolves.not.toThrowError();
    });
  });
});
