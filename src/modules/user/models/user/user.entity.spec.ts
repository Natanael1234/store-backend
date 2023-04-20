import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { Role } from '../../../authentication/enums/role/role.enum';
import { UserEntity } from './user.entity';

const userData1 = {
  name: 'User 1',
  email: 'user1@email.com',
  hash: { iv: 'iv1', encryptedData: 'ed1' },
  roles: [Role.ADMIN, Role.ROOT],
};
const userData2 = {
  name: 'User 2',
  email: 'user2@email.com',
  hash: { iv: 'iv2', encryptedData: 'ed2' },
  roles: [Role.USER],
};
const userData3 = {
  name: 'User 3',
  email: 'user3@email.com',
  hash: { iv: 'iv3', encryptedData: 'ed3' },
  roles: [Role.ADMIN],
};
const userArray = [userData1, userData2, userData3];

describe('UserEntity', () => {
  let module: TestingModule;
  let repo: Repository<UserEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    repo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  function validateUser(
    userData: {
      name: string;
      email: string;
      hash: { iv: string; encryptedData: string };
      roles?: Role[];
    },
    user: UserEntity,
    options?: {
      userId?: number;
      deleted?: boolean;
    },
  ) {
    expect(user).toBeInstanceOf(UserEntity);
    if (options?.userId) expect(user.id).toEqual(options.userId);
    expect(user.name).toEqual(userData.name);
    expect(user.email).toEqual(userData.email);
    expect(user.created).toBeDefined();
    expect(user.updated).toBeDefined();
    if (options?.deleted) {
      expect(user.deletedAt).not.toBeNull();
    } else {
      expect(user.deletedAt).toBeNull();
    }
    expect(user.roles).toEqual(userData.roles);
  }

  describe('create', () => {
    it('should insert users', async () => {
      const user1 = repo.create(userData1);
      const user2 = repo.create(userData2);
      const user3 = repo.create(userData3);
      await repo.insert(user1);
      await repo.insert(user2);
      await repo.insert(user3);
      const usersData = [userData1, userData2, userData3];
      const users = await repo
        .createQueryBuilder('user')
        .addSelect('user.hash')
        .getMany();

      expect(users).toHaveLength(3);
      expect(Array.isArray(users)).toBe(true);
      for (let i = 0, userId = 1; i < 3; i++, userId++) {
        validateUser(usersData[i], users[i], {
          userId,
        });
      }
    });

    it('should not insert an user with empty name', async () => {
      const fn = async () => {
        await repo.insert(
          repo.create({
            email: 'user@email.com',
            hash: { iv: 'new iv', encryptedData: 'new encrypted data' },
            roles: [Role.ADMIN],
          }),
        );
      };
      await expect(fn()).rejects.toThrow(QueryFailedError);
      await expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.name',
      );
    });

    it('should not insert an user with empty email', async () => {
      const fn = async () => {
        await repo.insert(
          repo.create({
            name: 'User',
            hash: { iv: 'new iv', encryptedData: 'new encrypted data' },
            roles: [Role.ADMIN],
          }),
        );
      };
      expect(fn()).rejects.toThrow(QueryFailedError);
      expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.email',
      );
    });

    it('should not insert an user with empty hash', async () => {
      const fn = async () => {
        await repo.insert(
          repo.create({
            name: 'User',
            email: 'user@email.com',
            roles: [Role.ADMIN],
          }),
        );
      };
      expect(fn()).rejects.toThrow(QueryFailedError);
      expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.hash',
      );
    });

    it('should not insert an user with duplicated email', async () => {
      const user1 = repo.create(userData1);

      const fn = async () => {
        await repo.insert(
          repo.create({
            name: 'User',
            email: userData1.email,
            roles: [Role.ADMIN],
          }),
        );
      };

      expect(fn()).rejects.toThrow(QueryFailedError);
      expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.hash',
      );
    });

    it.each([
      { description: 'null', value: null },
      { description: 'undefined', value: undefined },
    ])(
      'should not insert an user with $description role',
      async ({ value }) => {
        const fn = async () => {
          await repo.insert(
            repo.create({
              name: 'User',
              email: userData1.email,
              hash: { iv: 'iv3', encryptedData: 'ed3' },
              roles: value,
            }),
          );
        };
        expect(fn()).rejects.toThrow(QueryFailedError);
        expect(fn()).rejects.toThrow(
          'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.role',
        );
      },
    );
  });

  describe('find', () => {
    it('should find users', async () => {
      await repo.insert(repo.create(userData1));
      await repo.insert(repo.create(userData2));
      await repo.insert(repo.create(userData3));

      const insertedUsers = await repo.find();
      expect(Array.isArray(insertedUsers)).toBe(true);
      expect(insertedUsers).toHaveLength(3);
      const [insertedUser1, insertedUser2, insertedUser3] = insertedUsers;
      validateUser(userData1, insertedUser1, { userId: 1 });
      validateUser(userData2, insertedUser2, { userId: 2 });
      validateUser(userData3, insertedUser3, { userId: 3 });
    });
  });

  describe('find one', () => {
    it('should find one user by id', async () => {
      await repo.insert(repo.create(userData1));
      await repo.insert(repo.create(userData2));
      await repo.insert(repo.create(userData3));
      const foundUser = await repo.findOne({ where: { id: 2 } });
      validateUser(userData2, foundUser, { userId: 2 });
    });
  });

  describe('soft delete', () => {
    it('should soft delete an user', async () => {
      await repo.insert(repo.create(userData1));
      await repo.insert(repo.create(userData2));
      await repo.insert(repo.create(userData3));

      const deleteReturn = await repo.softDelete(2);
      expect(deleteReturn?.affected).toEqual(1);

      expect(deleteReturn).toEqual(deleteReturn);
      const users = await repo.find();
      const allUsers = await repo.find({ withDeleted: true });
      expect(users).toHaveLength(2);
      const [user1, user3] = users;
      validateUser(userData1, user1, { userId: 1 });
      validateUser(userData3, user3, { userId: 3 });

      const [user1_, user2_, user3_] = allUsers;
      expect(allUsers).toHaveLength(3);
      validateUser(userData1, user1_, { userId: 1 });
      validateUser(userData2, user2_, { userId: 2, deleted: true });
      validateUser(userData3, user3_, { userId: 3 });
    });
  });

  describe('update', () => {
    it('should update an user', async () => {
      await repo.insert(repo.create(userData1));
      await repo.insert(repo.create(userData2));
      await repo.insert(repo.create(userData3));
      const updateData = {
        name: 'User 2 updated',
        email: 'user2updated@gmail.com',
        hash: { iv: 'new iv', encryptedData: 'new encrypted data' },
        roles: [Role.ADMIN],
      };

      const updateUser = await repo.findOne({ where: { id: 2 } });
      updateUser.name = updateData.name;
      updateUser.email = updateData.email;
      updateUser.hash = updateData.hash;
      updateUser.roles = [Role.ADMIN];

      await repo.save(updateUser);
      const users = await repo.find();

      expect(users).toHaveLength(3);
      expect(updateUser).toBeInstanceOf(UserEntity);
      validateUser(userArray[0], users[0], { userId: 1 });
      validateUser(updateData, users[1], { userId: 2 });
      validateUser(userArray[2], users[2], { userId: 3 });
    });

    it('should update an user with empty name', async () => {
      await repo.insert(repo.create(userData1));
      const fn = async () => {
        await repo.update(1, {
          email: 'user@email.com',
          hash: { iv: 'new iv', encryptedData: 'new encrypted data' },
          roles: [Role.ADMIN],
        });
      };
      expect(fn()).resolves.not.toThrowError();
    });

    it('should update an user with empty email', async () => {
      await repo.insert(repo.create(userData1));
      const fn = async () => {
        await repo.update(1, {
          name: 'User',
          hash: { iv: 'new iv', encryptedData: 'new encrypted data' },
          roles: [Role.ADMIN],
        });
      };
      await expect(fn()).resolves.not.toThrowError();
    });

    it('should update an user with empty hash', async () => {
      await repo.insert(repo.create(userData1));
      const fn = async () => {
        await repo.update(1, {
          name: 'User',
          email: 'user@email.com',
          roles: [Role.ADMIN],
        });
      };
      await expect(fn()).resolves.not.toThrowError();
    });
  });
});
