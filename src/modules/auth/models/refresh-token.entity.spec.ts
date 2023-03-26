import { TestingModule } from '@nestjs/testing';
import { QueryFailedError, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getTestingModule } from '../../../.jest/test-config.module';
import { RefreshTokenEntity } from './refresh-token.entity';
import { ArrayMaxSize } from 'class-validator';

describe('UserEntity', () => {
  let module: TestingModule;
  let repo: Repository<RefreshTokenEntity>;
  const refreshTokensData = [
    {
      userId: 5,
      expiresAt: new Date(2023, 1, 2, 5, 6, 7, 8),
    },
    {
      userId: 6,
      expiresAt: new Date(2022, 3, 1, 6, 7, 8, 9),
      revoked: true,
    },
    {
      userId: 7,
      expiresAt: new Date(2021, 4, 5, 2, 3, 6, 7),
      revoked: false,
    },
  ];

  async function insertRefreshToken(refreshTokenData) {
    return await repo.insert(repo.create(refreshTokenData));
  }

  async function insertRefreshTokens(...refreshTokensData) {
    const ret = [];
    for (const refreshTokenData of refreshTokensData) {
      ret.push(await insertRefreshToken(refreshTokenData));
    }
    return ret;
  }

  async function updateRefreshToken(refreshTokenId: number, data: any) {
    return await repo.update(refreshTokenId, data);
  }

  async function findRedreshToken(refreshTokenId: number) {
    return await repo.findOne({ where: { id: refreshTokenId } });
  }

  async function findRedreshTokens() {
    return await repo.find();
  }

  function validateRedreshToken(
    refreshTokenData: any,
    refreshToken: RefreshTokenEntity,
  ) {
    expect(refreshToken).toBeInstanceOf(RefreshTokenEntity);
    expect(refreshToken.id).toEqual(refreshTokenData.id);
    expect(refreshToken.expiresAt.getTime()).toEqual(
      refreshTokenData.expiresAt.getTime(),
    );
    expect(refreshToken.userId).toEqual(refreshTokenData.userId);
  }

  describe('persistence', () => {
    beforeEach(async () => {
      module = await getTestingModule();
      repo = module.get<Repository<RefreshTokenEntity>>(
        getRepositoryToken(RefreshTokenEntity),
      );
    });

    describe('find', () => {
      it('should retrieve refreshtokens', async () => {
        await repo
          .createQueryBuilder()
          .insert()
          .into(RefreshTokenEntity)
          .values(refreshTokensData);
        const refreshTokens = await repo.find();
        expect(Array.isArray(refreshTokens)).toBe(true);
        for (let i = 0, id = 1; i < refreshTokens.length; i++, id++) {
          const refreshToken = refreshTokens[i];
          const refreshTokenData = refreshTokensData[i];
          const expectedData = {
            id,
            revoked: !!refreshTokenData.revoked,
            expiresAt: refreshTokenData.expiresAt,
            userId: refreshTokenData.userId,
          };
          validateRedreshToken(expectedData, refreshToken);
        }
      });
    });

    describe('find one', () => {
      it('should find a refresh token by user id', async () => {
        await insertRefreshToken(refreshTokensData);
        const refreshToken = await repo.findOne({
          where: { userId: refreshTokensData[1].userId },
        });
        const validationData = {
          id: 2,
          revoked: !!refreshTokensData[1].revoked,
          expiresAt: refreshTokensData[1].expiresAt,
          userId: refreshTokensData[1].userId,
        };
        validateRedreshToken(validationData, refreshToken);
      });
    });

    describe('insert', () => {
      it('should insert refresh-tokens', async () => {
        await insertRefreshToken(refreshTokensData[0]);
        await insertRefreshToken(refreshTokensData[1]);
        await insertRefreshToken(refreshTokensData[2]);
        const insertedRefreshTokens = await repo.find();
        expect(insertedRefreshTokens).toHaveLength(3);
        for (let i = 0, id = 1; i < 3; i++, id++) {
          const expectedResult = {
            id,
            userId: refreshTokensData[i].userId,
            revoked: !!refreshTokensData[i].revoked,
            expiresAt: refreshTokensData[i].expiresAt,
          };
          const insertedRefreshToken = insertedRefreshTokens[i];
          validateRedreshToken(expectedResult, insertedRefreshToken);
        }
      });

      it('should fail when inserting refresh token without user id', async () => {
        await expect(
          insertRefreshToken({ expiresAt: new Date() }),
        ).rejects.toThrow(
          'SQLITE_CONSTRAINT: NOT NULL constraint failed: refresh_tokens.userId',
        );
        await expect(
          insertRefreshToken({ expiresAt: new Date() }),
        ).rejects.toThrow(QueryFailedError);
      });

      it('should fail when inserting refresh token without expiration date', async () => {
        await expect(
          insertRefreshToken({ expiresAt: new Date() }),
        ).rejects.toThrow(
          'SQLITE_CONSTRAINT: NOT NULL constraint failed: refresh_tokens.userId',
        );
        await expect(insertRefreshToken({ userId: 2 })).rejects.toThrow(
          QueryFailedError,
        );
      });
    });

    describe('update', () => {
      it('should update a refresh token', async () => {
        await insertRefreshTokens(refreshTokensData[0], refreshTokensData[1]);
        const validationData1 = {
          id: 1,
          revoked: !!refreshTokensData[0].revoked,
          expiresAt: refreshTokensData[0].expiresAt,
          userId: refreshTokensData[0].userId,
        };
        const id = 2;
        const revoked = !!refreshTokensData[1].revoked;
        const userId = 11;
        const expiresAt = new Date(2023, 2, 2, 5, 6, 7, 8);
        const validationData2 = { id, userId, revoked, expiresAt };
        const updateData = { userId, revoked, expiresAt };

        const retUpdate = await updateRefreshToken(2, updateData);
        const refreshTokens = await findRedreshTokens();

        expect(retUpdate.affected).toEqual(1);
        expect(Array.isArray(refreshTokens)).toBe(true);
        expect(refreshTokens).toHaveLength(2);
        validateRedreshToken(validationData1, refreshTokens[0]);
        validateRedreshToken(validationData2, refreshTokens[1]);
      });

      it('should update only the user id', async () => {
        await insertRefreshTokens(refreshTokensData[0], refreshTokensData[1]);
        const validationData1 = {
          id: 1,
          revoked: !!refreshTokensData[0].revoked,
          expiresAt: refreshTokensData[0].expiresAt,
          userId: refreshTokensData[0].userId,
        };
        const id = 2;
        const revoked = refreshTokensData[1].expiresAt;
        const userId = 11;
        const expiresAt = refreshTokensData[1].expiresAt;
        const validationData2 = { id, userId, revoked, expiresAt };
        const updateData = { userId };

        const retUpdate = await updateRefreshToken(id, updateData);
        const refreshTokens = await findRedreshTokens();

        expect(retUpdate.affected).toEqual(1);
        expect(Array.isArray(refreshTokens)).toBe(true);
        expect(refreshTokens).toHaveLength(2);
        validateRedreshToken(validationData1, refreshTokens[0]);
        validateRedreshToken(validationData2, refreshTokens[1]);
      });

      it('should update only the revocation', async () => {
        await insertRefreshTokens(refreshTokensData[0], refreshTokensData[1]);
        const validationData1 = {
          id: 1,
          revoked: !!refreshTokensData[0].revoked,
          expiresAt: refreshTokensData[0].expiresAt,
          userId: refreshTokensData[0].userId,
        };
        const id = 2;
        const revoked = !refreshTokensData[1].revoked;
        const userId = refreshTokensData[1].userId;
        const expiresAt = refreshTokensData[1].expiresAt;
        const validationData2 = { id, userId, revoked, expiresAt };
        const updateData = { revoked };

        const retUpdate = await updateRefreshToken(id, updateData);
        const refreshTokens = await findRedreshTokens();

        expect(retUpdate.affected).toEqual(1);
        expect(Array.isArray(refreshTokens)).toBe(true);
        expect(refreshTokens).toHaveLength(2);
        validateRedreshToken(validationData1, refreshTokens[0]);
        validateRedreshToken(validationData2, refreshTokens[1]);
      });

      it('should update only the expiresAt', async () => {
        await insertRefreshTokens(refreshTokensData[0], refreshTokensData[1]);
        const validationData1 = {
          id: 1,
          revoked: !!refreshTokensData[0].revoked,
          expiresAt: refreshTokensData[0].expiresAt,
          userId: refreshTokensData[0].userId,
        };
        const id = 2;
        const revoked = !!refreshTokensData[1].revoked;
        const userId = refreshTokensData[1].userId;
        const expiresAt = new Date(2023, 2, 2, 5, 6, 7, 8);
        const validationData2 = { id, userId, revoked, expiresAt };
        const updateData = { expiresAt };

        const retUpdate = await updateRefreshToken(id, updateData);
        const refreshTokens = await findRedreshTokens();

        expect(retUpdate.affected).toEqual(1);
        expect(Array.isArray(refreshTokens)).toBe(true);
        expect(refreshTokens).toHaveLength(2);
        validateRedreshToken(validationData1, refreshTokens[0]);
        validateRedreshToken(validationData2, refreshTokens[1]);
      });
    });
  });
});
