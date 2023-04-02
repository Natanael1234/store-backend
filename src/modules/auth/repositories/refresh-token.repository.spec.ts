import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../.jest/test-config.module';
import { UserEntity } from '../../user/models/user/user.entity';
import { RefreshTokenEntity } from '../models/refresh-token.entity';
import { RefreshTokenRepository } from './refresh-token.repository';

describe('RefreshTokenRepository', () => {
  let module: TestingModule;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<UserEntity>;

  const userData1 = {
    name: 'User 1',
    email: 'user1@email.com',
    hash: { iv: 'bla', encryptedData: 'blabla' },
  };
  const userData2 = {
    name: 'User 2',
    email: 'user2@email.com',
    hash: { iv: 'bla', encryptedData: 'blabla' },
  };
  const userData3 = {
    name: 'User 3',
    email: 'user3@email.com',
    hash: { iv: 'bla', encryptedData: 'blabla' },
  };
  const usersData = [userData1, userData2, userData3];

  beforeEach(async () => {
    module = await getTestingModule();
    refreshTokenRepo = module.get<RefreshTokenRepository>(
      RefreshTokenRepository,
    );
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  async function createUsers(usersData: any[]) {
    for (const userData of usersData) {
      await userRepo.insert(userRepo.create(userData));
    }
  }

  async function createRefreshTokens(refreshTokensData: any[]) {
    for (const refreshTokenData of refreshTokensData) {
      await refreshTokenRepo.insert(refreshTokenRepo.create(refreshTokenData));
    }
  }

  function validateRefreshToken(validationData: any, refreshToken: any) {
    expect(refreshToken).toBeInstanceOf(RefreshTokenEntity);
    expect(refreshToken.id).toBe(validationData.id);
    expect(refreshToken.revoked).toBe(validationData.revoked);
    expect(refreshToken.userId).toBe(validationData.userId);
    if (validationData.expiresAfter) {
      expect(refreshToken.expiresAt.getTime()).toBeGreaterThanOrEqual(
        validationData.expiresAfter,
      );
    }
    if (validationData.expiresBefore) {
      expect(refreshToken.expiresAt.getTime()).toBeLessThanOrEqual(
        validationData.expiresBefore,
      );
    }
  }

  describe('createRefreshToken', () => {
    it('should create a refresh token', async () => {
      const ttl = 2000;
      const expiresAfter = new Date().getTime() + ttl;
      await createUsers(usersData);
      const users = await userRepo.find();
      const returnedRefreshToken = await refreshTokenRepo.createRefreshToken(
        users[1],
        2000,
      );
      const expiresBefore = new Date().getTime() + ttl;
      const createdRefreshTokens = await refreshTokenRepo.find({
        where: { userId: 2 },
      });

      expect(createRefreshTokens).toHaveLength(1);
      expect(returnedRefreshToken).toBeDefined();
      const validationData = {
        id: 1,
        revoked: false,
        expiresBefore,
        expiresAfter,
        userId: 2,
      };
      await validateRefreshToken(validationData, returnedRefreshToken);
      await validateRefreshToken(validationData, createdRefreshTokens[0]);
      expect(returnedRefreshToken.expiresAt).toEqual(
        createdRefreshTokens[0].expiresAt,
      );
    });

    it('should create multiple refresh tokens for the same user', async () => {
      const ttl1 = 1000;
      const ttl2 = 2000;
      const ttl3 = 3000;
      await createUsers(usersData);

      const validationData = {
        id: 1,
        revoked: false,
        userId: 2,
      };

      const users = await userRepo.find();

      const expiresAfter1 = new Date().getTime() + ttl1;
      await refreshTokenRepo.createRefreshToken(users[0], ttl1);
      const expiresBefore1 = new Date().getTime() + ttl1;

      const expiresAfter2 = new Date().getTime() + ttl2;
      await refreshTokenRepo.createRefreshToken(users[1], ttl2);
      const expiresBefore2 = new Date().getTime() + ttl2;

      const expiresAfter3 = new Date().getTime() + ttl3;
      await refreshTokenRepo.createRefreshToken(users[1], ttl3);
      const expiresBefore3 = new Date().getTime() + ttl3;

      const createdRefreshTokens = await refreshTokenRepo.find();

      expect(createdRefreshTokens).toHaveLength(3);

      validateRefreshToken(
        {
          id: 1,
          revoked: false,
          userId: 1,
          expiresAfter: expiresAfter1,
          expiresBefore: expiresBefore1,
        },
        createdRefreshTokens[0],
      );

      validateRefreshToken(
        {
          id: 2,
          revoked: false,
          userId: 2,
          expiresAfter: expiresAfter2,
          expiresBefore: expiresBefore2,
        },
        createdRefreshTokens[1],
      );

      validateRefreshToken(
        {
          id: 3,
          revoked: false,
          userId: 2,
          expiresAfter: expiresAfter3,
          expiresBefore: expiresBefore3,
        },
        createdRefreshTokens[2],
      );
    });

    it('should fail when user is null', async () => {
      const fn = async () => refreshTokenRepo.createRefreshToken(null, 1000);
      expect(fn()).rejects.toThrow('User is required');
    });

    it('should fail when user is undefined', async () => {
      const fn = async () =>
        refreshTokenRepo.createRefreshToken(undefined, 1000);
      expect(fn()).rejects.toThrow('User is required');
    });

    it('should fail when user id is undefined', async () => {
      const fn = async () =>
        refreshTokenRepo.createRefreshToken(new UserEntity(), 1000);
      expect(fn()).rejects.toThrow('User id is required');
    });

    it('should fail when ttl is undefined', async () => {
      await createUsers(usersData);
      const user = await userRepo.findOne({ where: { id: 2 } });
      const fn = async () =>
        refreshTokenRepo.createRefreshToken(user, undefined);
      expect(fn()).rejects.toThrow('ttl is required');
    });

    it('should fail when ttl is null', async () => {
      await createUsers(usersData);
      const user = await userRepo.findOne({ where: { id: 2 } });
      const fn = async () => refreshTokenRepo.createRefreshToken(user, null);
      expect(fn()).rejects.toThrow('ttl is required');
    });
  });

  describe('findTokenById', () => {
    it('should find refresh token by id', async () => {
      const ttl1 = 1000;
      const ttl2 = 2000;
      const ttl3 = 3000;
      await createUsers(usersData);
      const users = await userRepo.find();
      const expiresAfter1 = new Date().getTime() + ttl1;
      await refreshTokenRepo.createRefreshToken(users[0], 1000);
      const expiresBefore1 = new Date().getTime() + ttl1;
      const expiresAfter2 = new Date().getTime() + ttl2;
      await refreshTokenRepo.createRefreshToken(users[1], 2000);
      const expiresBefore2 = new Date().getTime() + ttl2;
      const expiresAfter3 = new Date().getTime() + ttl3;
      await refreshTokenRepo.createRefreshToken(users[1], 3000);
      const expiresBefore3 = new Date().getTime() + ttl3;

      const refreshToken1 = await refreshTokenRepo.findTokenById(1);
      const refreshToken2 = await refreshTokenRepo.findTokenById(2);
      const refreshToken3 = await refreshTokenRepo.findTokenById(3);

      validateRefreshToken(
        {
          id: 1,
          revoked: false,
          userId: 1,
          expiresAfter: expiresAfter1,
          expiresBefore: expiresBefore1,
        },
        refreshToken1,
      );

      validateRefreshToken(
        {
          id: 2,
          revoked: false,
          userId: 2,
          expiresAfter: expiresAfter2,
          expiresBefore: expiresBefore2,
        },
        refreshToken2,
      );

      validateRefreshToken(
        {
          id: 3,
          revoked: false,
          userId: 2,
          expiresAfter: expiresAfter3,
          expiresBefore: expiresBefore3,
        },
        refreshToken3,
      );
    });

    it('should fail when user id is null', async () => {
      const fn = async () => await refreshTokenRepo.findTokenById(null);
      await expect(fn()).rejects.toThrow('User id is required');
    });

    it('should fail when user id is undefined', async () => {
      const fn = async () => await refreshTokenRepo.findTokenById(undefined);
      await expect(fn()).rejects.toThrow('User id is required');
    });

    it('should fail when token is inexistent', async () => {
      await createUsers(usersData);
      const fn = async () => await refreshTokenRepo.findTokenById(10);
      await expect(fn()).rejects.toThrow('Refresh token not found');
    });
  });
});
