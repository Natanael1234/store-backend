import { UserEntity } from './user.entity';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestingModule } from '@nestjs/testing';
import { QueryFailedError, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

const userData1 = {
  name: 'User 1',
  email: 'user1@email.com',
  hash: {
    iv: 'iv1',
    encryptedData: 'ed1',
  },
};
const userData2 = {
  name: 'User 2',
  email: 'user2@email.com',
  hash: {
    iv: 'iv2',
    encryptedData: 'ed2',
  },
};
const userData3 = {
  name: 'User 3',
  email: 'user3@email.com',
  hash: {
    iv: 'iv3',
    encryptedData: 'ed3',
  },
};
const userArray = [userData1, userData2, userData3];

const id = 2;
const name = 'John';
const email = 'john@email.com';
const hash = { iv: 'testIv', encryptedData: 'testData' };
const created = new Date(2023, 2, 14);
const updated = new Date(2023, 2, 15);
const deletedAt = new Date(2023, 2, 16);

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
            hash: {
              iv: 'new iv',
              encryptedData: 'new encrypted data',
            },
          }),
        );
      };
      expect(fn()).rejects.toThrow(QueryFailedError);
      expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.name',
      );
    });

    it('should not insert an user with empty email', async () => {
      const fn = async () => {
        await repo.insert(
          repo.create({
            name: 'User',
            hash: {
              iv: 'new iv',
              encryptedData: 'new encrypted data',
            },
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
          }),
        );
      };
      expect(fn()).rejects.toThrow(QueryFailedError);
      expect(fn()).rejects.toThrow(
        'SQLITE_CONSTRAINT: NOT NULL constraint failed: users.hash',
      );
    });
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
        hash: {
          iv: 'new iv',
          encryptedData: 'new encrypted data',
        },
      };
      const usersData = [userData1, updateData, userData3];
      const updatedUser = await repo.findOne({ where: { id: 2 } });
      updatedUser.name = updateData.name;
      updatedUser.email = updateData.email;
      updatedUser.hash = updateData.hash;
      await repo.save(updatedUser);
      const users = await repo.find();
      expect(users).toHaveLength(3);
      expect(updatedUser).toBeInstanceOf(UserEntity);
      for (let i = 0, userId = 1; i < 3; i++, userId++) {
        validateUser(usersData[i], users[i], { userId });
      }
    });

    it('should update an user with empty name', async () => {
      await repo.insert(repo.create(userData1));
      const fn = async () => {
        await repo.update(1, {
          email: 'user@email.com',
          hash: {
            iv: 'new iv',
            encryptedData: 'new encrypted data',
          },
        });
      };
      expect(fn()).resolves.not.toThrowError();
    });

    it('should update an user with empty email', async () => {
      await repo.insert(repo.create(userData1));
      const fn = async () => {
        await repo.update(1, {
          name: 'User',
          hash: {
            iv: 'new iv',
            encryptedData: 'new encrypted data',
          },
        });
      };
      await expect(fn()).resolves.not.toThrowError();
    });

    it('should update an user with empty hash', async () => {
      await repo.insert(repo.create(userData1));
      const fn = async () => {
        await repo.update(1, { name: 'User', email: 'user@email.com' });
      };
      await expect(fn()).resolves.not.toThrowError();
    });
  });
});
