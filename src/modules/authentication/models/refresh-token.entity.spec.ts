import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { getTestingModule } from '../../../.jest/test-config.module';
import { EncryptionService } from '../../system/encryption/services/encryption/encryption.service';
import { User } from '../../user/models/user/user.entity';
import { Role } from '../enums/role/role.enum';
import { RefreshToken } from './refresh-token.entity';

describe('User entity', () => {
  let module: TestingModule;
  let refreshTokenRepo: Repository<RefreshToken>;
  let userRepo: Repository<User>;
  let encryptionService: EncryptionService;

  type RefreshTokenData = {
    revoked?: boolean;
    expiresAt: Date;
    userId: string;
  };

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

  async function insertRefreshTokens(...users: RefreshTokenData[]) {
    const ids = [];
    for (const user of users) {
      const ret = await refreshTokenRepo
        .createQueryBuilder()
        .insert()
        .into(RefreshToken)
        .values({
          revoked: user.revoked,
          expiresAt: user.expiresAt,
          userId: user.userId,
        })
        .execute();
      ids.push(ret.identifiers[0].id);
    }
    return ids;
  }

  function validateRefreshToken(
    refreshTokenExpectedData: any,
    refreshToken: RefreshToken,
  ) {
    expect(refreshToken).toBeInstanceOf(RefreshToken);
    expect(refreshToken.id).toEqual(refreshTokenExpectedData.id);
    expect(refreshToken.expiresAt.getTime()).toEqual(
      refreshTokenExpectedData.expiresAt.getTime(),
    );
    expect(refreshToken.userId).toEqual(refreshTokenExpectedData.userId);
  }

  function validateRedreshTokens(
    refreshTokensExpectedData: any[],
    refreshTokens: RefreshToken[],
  ) {
    expect(refreshTokens).toBeDefined();
    expect(refreshTokens.length).toEqual(refreshTokensExpectedData.length);
    for (let i = 0; i < refreshTokensExpectedData.length; i++) {
      validateRefreshToken(refreshTokensExpectedData[i], refreshTokens[i]);
    }
  }

  describe('persistence', () => {
    beforeEach(async () => {
      module = await getTestingModule();
      refreshTokenRepo = module.get<Repository<RefreshToken>>(
        getRepositoryToken(RefreshToken),
      );
      userRepo = module.get<Repository<User>>(getRepositoryToken(User));
      encryptionService = module.get<EncryptionService>(EncryptionService);
    });

    afterEach(async () => {
      await module.close(); // TODO: é necessário?
    });

    describe('find', () => {
      it('should retrieve refreshtokens', async () => {
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

        // TODO: não possui relação com o usuário. Verificar se deve usar uuid real.
        const [refreshTokenId1, refreshTokenId2, refreshTokenId3] =
          await insertRefreshTokens(
            {
              userId: userId1,
              expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
            },
            {
              userId: userId2,
              expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
              revoked: true,
            },
            {
              userId: userId3,
              expiresAt: new Date(2021, 4, 5, 2, 3, 6, 7),
              revoked: false,
            },
          );
        const refreshTokens = await refreshTokenRepo
          .createQueryBuilder('refreshToken')
          .getMany();
        expect(Array.isArray(refreshTokens)).toBe(true);
        expect(refreshTokens).toHaveLength(3);
        validateRefreshToken(
          {
            id: refreshTokenId1,
            revoked: false,
            userId: userId1,
            expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
          },
          refreshTokens[0],
        );
        validateRefreshToken(
          {
            id: refreshTokenId2,
            revoked: true,
            userId: userId2,
            expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
          },
          refreshTokens[1],
        );
        validateRefreshToken(
          {
            id: refreshTokenId3,
            revoked: true,
            userId: userId3,
            expiresAt: new Date(2021, 4, 5, 2, 3, 6, 7),
          },
          refreshTokens[2],
        );
      });
    });

    describe('find one', () => {
      it('should find a refresh token by user id', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Acbd*1',
            roles: [Role.ROOT],
            active: false,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Acbd*2',
            roles: [Role.ADMIN],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Acbd*2',
            roles: [Role.USER],
            active: true,
          },
        );
        const [refreshTokenId1, refreshTokenId2, refreshTokenId3] =
          await insertRefreshTokens(
            {
              userId: userId1,
              expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
            },
            {
              userId: userId2,
              expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
              revoked: true,
            },
            {
              userId: userId3,
              expiresAt: new Date(2021, 4, 5, 2, 3, 6, 7),
              revoked: false,
            },
          );
        const refreshToken = await refreshTokenRepo.findOne({
          where: { userId: userId2 },
        });
        validateRefreshToken(
          {
            id: refreshTokenId2,
            userId: userId2,
            expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
            revoked: true,
          },
          refreshToken,
        );
      });
    });

    describe('insert', () => {
      it('should insert refresh-tokens', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Acbd*1',
            roles: [Role.ROOT],
            active: false,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Acbd*2',
            roles: [Role.ADMIN],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Acbd*2',
            roles: [Role.USER],
            active: true,
          },
        );
        const [refreshTokenId1, refreshTokenId2, refreshTokenId3] =
          await insertRefreshTokens(
            {
              userId: userId1,
              expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
            },
            {
              userId: userId2,
              expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
              revoked: true,
            },
            {
              userId: userId3,
              expiresAt: new Date(2021, 4, 5, 2, 3, 6, 7),
              revoked: false,
            },
          );

        const refreshTokens = await refreshTokenRepo.find();
        expect(refreshTokens).toHaveLength(3);

        validateRedreshTokens(
          [
            {
              id: refreshTokenId1,
              userId: userId1,
              revoked: false,
              expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
            },
            {
              id: refreshTokenId2,
              userId: userId2,
              revoked: true,
              expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
            },
            {
              id: refreshTokenId3,
              userId: userId3,
              revoked: false,
              expiresAt: new Date(2021, 4, 5, 2, 3, 6, 7),
            },
          ],
          refreshTokens,
        );
      });

      it('should reject when inserting refresh token without userId', async () => {
        await await expect(
          insertRefreshTokens({ expiresAt: new Date() } as RefreshTokenData),
        ).rejects.toThrow(
          'SQLITE_CONSTRAINT: NOT NULL constraint failed: refresh_tokens.userId',
        );
        await expect(
          insertRefreshTokens({ expiresAt: new Date() } as RefreshTokenData),
        ).rejects.toThrow(QueryFailedError);
      });

      it('should reject when inserting refresh token without expiration date', async () => {
        const [userId] = await insertUsers({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
        });

        await expect(
          insertRefreshTokens({ userId } as RefreshTokenData),
        ).rejects.toThrow(
          'SQLITE_CONSTRAINT: NOT NULL constraint failed: refresh_tokens.expiresAt',
        );

        await expect(
          insertRefreshTokens({ userId } as RefreshTokenData),
        ).rejects.toThrow(QueryFailedError);
      });
    });

    describe('update', () => {
      it('should update a refresh token', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Acbd*1',
            roles: [Role.ROOT],
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Acbd*2',
            roles: [Role.ADMIN],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Acbd*2',
            roles: [Role.USER],
            active: true,
          },
        );
        const [refreshTokenId1, refreshTokenId2] = await insertRefreshTokens(
          {
            userId: userId1,
            expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
          },
          {
            userId: userId2,
            expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
            revoked: true,
          },
        );
        const retUpdate = await refreshTokenRepo.update(refreshTokenId1, {
          userId: userId2,
          revoked: true,
          expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
        });
        expect(retUpdate.affected).toEqual(1);
        const refreshTokens = await refreshTokenRepo
          .createQueryBuilder('refreshToken')
          .getMany();
        expect(Array.isArray(refreshTokens)).toBe(true);
        expect(refreshTokens).toHaveLength(2);
        validateRefreshToken(
          {
            id: refreshTokenId1,
            revoked: true,
            expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
            userId: userId2,
          },
          refreshTokens[0],
        );
        validateRefreshToken(
          {
            id: refreshTokenId2,
            userId: userId2,
            revoked: true,
            expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
          },
          refreshTokens[1],
        );
      });

      it('should update only the user id', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Acbd*1',
            roles: [Role.ROOT],
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Acbd*2',
            roles: [Role.ADMIN],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Acbd*2',
            roles: [Role.USER],
            active: true,
          },
        );
        const [refreshTokenId1, refreshTokenId2, refreshTokenId3] =
          await insertRefreshTokens(
            {
              userId: userId1,
              expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
            },
            {
              userId: userId2,
              expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
              revoked: true,
            },
          );

        const retUpdate = await refreshTokenRepo.update(refreshTokenId2, {
          userId: userId3,
        });
        const refreshTokens = await refreshTokenRepo
          .createQueryBuilder('refreshToken')
          .getMany();
        expect(retUpdate.affected).toEqual(1);
        expect(Array.isArray(refreshTokens)).toBe(true);
        expect(refreshTokens).toHaveLength(2);
        validateRefreshToken(
          {
            id: refreshTokenId1,
            userId: userId1,
            revoked: false,
            expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
          },
          refreshTokens[0],
        );
        validateRefreshToken(
          {
            id: refreshTokenId2,
            userId: userId3,
            revoked: true,
            expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
          },
          refreshTokens[1],
        );
      });

      it('should update only the revocation', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Acbd*1',
            roles: [Role.ROOT],
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Acbd*2',
            roles: [Role.ADMIN],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Acbd*2',
            roles: [Role.USER],
            active: true,
          },
        );
        const [refreshTokenId1, refreshTokenId2, refreshTokenId3] =
          await insertRefreshTokens(
            {
              userId: userId1,
              expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
            },
            {
              userId: userId2,
              expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
              revoked: true,
            },
          );

        const retUpdate = await refreshTokenRepo.update(refreshTokenId2, {
          revoked: false,
        });
        const refreshTokens = await refreshTokenRepo
          .createQueryBuilder('refreshToken')
          .getMany();
        expect(retUpdate.affected).toEqual(1);
        expect(Array.isArray(refreshTokens)).toBe(true);
        expect(refreshTokens).toHaveLength(2);
        validateRefreshToken(
          {
            id: refreshTokenId1,
            revoked: false,
            expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
            userId: userId1,
          },
          refreshTokens[0],
        );
        validateRefreshToken(
          {
            id: refreshTokenId2,
            expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
            revoked: false,
            userId: userId2,
          },
          refreshTokens[1],
        );
      });

      it('should update only the expiresAt', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Acbd*1',
            roles: [Role.ROOT],
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Acbd*2',
            roles: [Role.ADMIN],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Acbd*2',
            roles: [Role.USER],
            active: true,
          },
        );
        const [refreshTokenId1, refreshTokenId2, refreshTokenId3] =
          await insertRefreshTokens(
            {
              userId: userId1,
              expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
            },
            {
              userId: userId2,
              expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
              revoked: true,
            },
          );
        const retUpdate = await refreshTokenRepo.update(refreshTokenId2, {
          expiresAt: new Date(2023, 2, 2, 5, 6, 7, 8),
        });
        const refreshTokens = await refreshTokenRepo
          .createQueryBuilder('refreshToken')
          .getMany();
        expect(retUpdate.affected).toEqual(1);
        expect(Array.isArray(refreshTokens)).toBe(true);
        expect(refreshTokens).toHaveLength(2);
        validateRefreshToken(
          {
            id: refreshTokenId1,
            revoked: false,
            expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
            userId: userId1,
          },
          refreshTokens[0],
        );
        validateRefreshToken(
          {
            id: refreshTokenId2,
            userId: userId2,
            revoked: false,
            expiresAt: new Date(2023, 2, 2, 5, 6, 7, 8),
          },
          refreshTokens[1],
        );
      });
    });
  });
});
