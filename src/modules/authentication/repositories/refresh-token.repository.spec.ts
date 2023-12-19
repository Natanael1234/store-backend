import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../.jest/test-config.module';
import { EncryptionService } from '../../system/encryption/services/encryption/encryption.service';
import { UserConstants } from '../../user/constants/user/user-entity.constants';
import { UserMessage } from '../../user/enums/messages/user/user.messages.enum';
import { User } from '../../user/models/user/user.entity';
import { Role } from '../enums/role/role.enum';
import { RefreshTokenMessage } from '../messages/refresh-token/refresh-token.messages.enum';
import { RefreshToken } from '../models/refresh-token.entity';
import { RefreshTokenRepository } from './refresh-token.repository';

describe('RefreshTokenRepository', () => {
  let module: TestingModule;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<User>;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    module = await getTestingModule();
    refreshTokenRepo = module.get<RefreshTokenRepository>(
      RefreshTokenRepository,
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

  type RefreshTokenData = {
    revoked?: boolean;
    expiresAt: Date;
    userId: string;
  };

  async function createRefreshTokens(refreshTokensData: any[]) {
    for (const refreshTokenData of refreshTokensData) {
      await refreshTokenRepo.insert(refreshTokenRepo.create(refreshTokenData));
    }
  }

  function testValidateRefreshToken(
    validationData: {
      id: number;
      revoked: boolean;
      expiresBefore: number;
      expiresAfter: number;
      userId: string;
    },
    refreshToken: RefreshToken,
  ) {
    expect(refreshToken).toBeInstanceOf(RefreshToken);
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

      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          password: 'Abcd*1',
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          roles: [Role.ADMIN],
          password: 'Abcd*2',
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          roles: [Role.USER],
          password: 'Abcd*3',
        },
      );

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

      const returnedRefreshToken = await refreshTokenRepo.createRefreshToken(
        users[1],
        2000,
      );
      const expiresBefore = new Date().getTime() + ttl;
      const createdRefreshTokens = await refreshTokenRepo.find({
        where: { userId: userId2 },
      });
      expect(createRefreshTokens).toHaveLength(1);
      expect(returnedRefreshToken).toBeDefined();
      const validationData = {
        id: 1,
        revoked: false,
        expiresBefore,
        expiresAfter,
        userId: userId2,
      };
      await testValidateRefreshToken(validationData, returnedRefreshToken);
      await testValidateRefreshToken(validationData, createdRefreshTokens[0]);
      expect(returnedRefreshToken.expiresAt).toEqual(
        createdRefreshTokens[0].expiresAt,
      );
    });

    it('should create multiple refresh tokens for the same user', async () => {
      const ttl1 = 1000;
      const ttl2 = 2000;
      const ttl3 = 3000;
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          password: 'Abcd*1',
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          roles: [Role.ADMIN],
          password: 'Abcd*2',
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          roles: [Role.USER],
          password: 'Abcd*3',
          active: true,
        },
      );

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

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

      testValidateRefreshToken(
        {
          id: 1,
          revoked: false,
          userId: userId1,
          expiresAfter: expiresAfter1,
          expiresBefore: expiresBefore1,
        },
        createdRefreshTokens[0],
      );

      testValidateRefreshToken(
        {
          id: 2,
          revoked: false,
          userId: userId2,
          expiresAfter: expiresAfter2,
          expiresBefore: expiresBefore2,
        },
        createdRefreshTokens[1],
      );

      testValidateRefreshToken(
        {
          id: 3,
          revoked: false,
          userId: userId2,
          expiresAfter: expiresAfter3,
          expiresBefore: expiresBefore3,
        },
        createdRefreshTokens[2],
      );
    });

    it('should fail when user is null', async () => {
      const fn = async () => refreshTokenRepo.createRefreshToken(null, 1000);
      expect(fn()).rejects.toThrow(UserMessage.REQUIRED);
    });

    it('should fail when user is undefined', async () => {
      const fn = async () =>
        refreshTokenRepo.createRefreshToken(undefined, 1000);
      expect(fn()).rejects.toThrow(UserMessage.REQUIRED);
    });

    it('should fail when user id is undefined', async () => {
      const fn = async () =>
        refreshTokenRepo.createRefreshToken(new User(), 1000);
      expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
    });

    it('should fail when ttl is undefined', async () => {
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          password: 'Abcd*1',
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          roles: [Role.ADMIN],
          password: 'Abcd*2',
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          roles: [Role.USER],
          password: 'Abcd*3',
          active: true,
        },
      );

      const user = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .where(UserConstants.USER_ID_EQUALS_TO, { userId: userId2 })
        .getOne();

      const fn = async () =>
        refreshTokenRepo.createRefreshToken(user, undefined);
      expect(fn()).rejects.toThrow('ttl is required');
    });

    it('should fail when ttl is null', async () => {
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          password: 'Abcd*1',
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          roles: [Role.ADMIN],
          password: 'Abcd*2',
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          roles: [Role.USER],
          password: 'Abcd*3',
          active: true,
        },
      );
      const user = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .where(UserConstants.USER_ID_EQUALS_TO, { userId: userId2 })
        .getOne();
      const fn = async () => refreshTokenRepo.createRefreshToken(user, null);
      expect(fn()).rejects.toThrow('ttl is required');
    });
  });

  describe('findTokenById', () => {
    it('should find refresh token by id', async () => {
      const ttl1 = 1000;
      const ttl2 = 2000;
      const ttl3 = 3000;

      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          password: 'Abcd*1',
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          roles: [Role.ADMIN],
          password: 'Abcd*2',
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          roles: [Role.USER],
          password: 'Abcd*3',
          active: true,
        },
      );
      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
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

      testValidateRefreshToken(
        {
          id: 1,
          revoked: false,
          userId: userId1,
          expiresAfter: expiresAfter1,
          expiresBefore: expiresBefore1,
        },
        refreshToken1,
      );

      testValidateRefreshToken(
        {
          id: 2,
          revoked: false,
          userId: userId2,
          expiresAfter: expiresAfter2,
          expiresBefore: expiresBefore2,
        },
        refreshToken2,
      );

      testValidateRefreshToken(
        {
          id: 3,
          revoked: false,
          userId: userId2,
          expiresAfter: expiresAfter3,
          expiresBefore: expiresBefore3,
        },
        refreshToken3,
      );
    });

    it('should fail when token  id is null', async () => {
      const fn = async () => await refreshTokenRepo.findTokenById(null);
      await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
    });

    it('should fail when token is undefined', async () => {
      const fn = async () => await refreshTokenRepo.findTokenById(undefined);
      await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
    });

    it('should fail when token is inexistent', async () => {
      const fn = async () => await refreshTokenRepo.findTokenById(10);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.NOT_FOUND);
    });
  });
});
