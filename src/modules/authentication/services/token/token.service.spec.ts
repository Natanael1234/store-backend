import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JsonWebTokenError } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { UserMessage } from '../../../user/enums/messages/user/user-messages.ts/user-messages.enum';
import { UserEntity } from '../../../user/models/user/user.entity';
import { RefreshTokenMessage } from '../../enums/refresh-token-messages.ts/refresh-token-messages.enum';
import { Role } from '../../enums/role/role.enum';
import { RefreshTokenEntity } from '../../models/refresh-token.entity';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { TokenService } from './token.service';

const userData1 = {
  name: 'User 1',
  email: 'user1@email.com',
  roles: [Role.ROOT],
  hash: {
    iv: 'iv1',
    encryptedData: 'ed1',
  },
};
const userData2 = {
  name: 'User 2',
  email: 'user2@email.com',
  roles: [Role.ADMIN],
  hash: {
    iv: 'iv2',
    encryptedData: 'ed2',
  },
};
const userData3 = {
  name: 'User 3',
  email: 'user3@email.com',
  roles: [Role.USER],
  hash: {
    iv: 'iv3',
    encryptedData: 'ed3',
  },
};

describe('TokenServiceService', () => {
  let tokenService: TokenService;
  let jwtService: JwtService;
  let userRepo: Repository<UserEntity>;
  let refreshTokenRepo: RefreshTokenRepository;
  let module: TestingModule;

  beforeEach(async () => {
    module = await getTestingModule();
    tokenService = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    refreshTokenRepo = module.get<RefreshTokenRepository>(
      RefreshTokenRepository,
    );
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('generateAccessToken', () => {
    it('should generate an access token', async () => {
      const userId = 2;
      const user = new UserEntity();
      user.id = userId;
      const accessToken = await tokenService.generateAccessToken(user);
      expect(accessToken).toBeDefined();
      expect(accessToken.length).toBeGreaterThanOrEqual(20); // TODO: size unknown

      const decodedAccessToken = await jwtService.decode(accessToken);
      expect(decodedAccessToken['sub']).toBeDefined();
      expect(decodedAccessToken['exp']).toBeDefined();
      expect(decodedAccessToken['iat']).toBeDefined();
      expect(decodedAccessToken['sub']).toEqual(`${userId}`);
      expect(decodedAccessToken['exp']).toBeGreaterThan(
        decodedAccessToken['iat'],
      );
    });

    it('should fail when user is null', async () => {
      const fn = async () => tokenService.generateAccessToken(null);
      await expect(fn()).rejects.toThrow(UserMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when user is undefined', async () => {
      const fn = async () => tokenService.generateAccessToken(undefined);
      await expect(fn()).rejects.toThrow(UserMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when user id is not defined', async () => {
      const fn = async () => tokenService.generateAccessToken(new UserEntity());
      await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate an refresh token', async () => {
      const user = new UserEntity();
      user.id = 2;
      const refreshToken = await tokenService.generateRefreshToken(user);
      expect(refreshToken).toBeDefined();
      expect(refreshToken.length).toBeGreaterThanOrEqual(20); // TODO: size unknown
    });

    it('should fail when user is null', async () => {
      const fn = async () => tokenService.generateRefreshToken(null);
      await expect(fn()).rejects.toThrow(UserMessage.REQUIRED);
    });

    it('should fail when user is undefined', async () => {
      const fn = async () => tokenService.generateRefreshToken(undefined);
      await expect(fn()).rejects.toThrow(UserMessage.REQUIRED);
    });

    it('should fail when user id is not defined', async () => {
      const fn = async () =>
        tokenService.generateRefreshToken(new UserEntity());
      await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
    });
  });

  describe('resolveRefreshToken', () => {
    function validateResolvedRefreshToken(
      resolved: { refreshToken: any; user: any },
      userId: number,
      refreshTokenId: number,
    ) {
      expect(resolved).toBeDefined();

      expect(resolved.refreshToken).toBeDefined();
      expect(resolved.refreshToken).toBeInstanceOf(RefreshTokenEntity);
      expect(resolved.refreshToken.id).toEqual(refreshTokenId);
      expect(resolved.refreshToken.userId).toEqual(userId);

      expect(resolved.user).toBeDefined();
      expect(resolved.user).toBeInstanceOf(UserEntity);
      expect(resolved.user.id).toEqual(userId);
    }

    it('should resolve refresh token', async () => {
      await userRepo.insert(userRepo.create(userData1));
      await userRepo.insert(userRepo.create(userData2));
      await userRepo.insert(userRepo.create(userData3));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      const resolvedRefreshTokens = [
        await tokenService.resolveRefreshToken(generatedRefreshTokens[0]),
        await tokenService.resolveRefreshToken(generatedRefreshTokens[1]),
        await tokenService.resolveRefreshToken(generatedRefreshTokens[2]),
      ];

      validateResolvedRefreshToken(resolvedRefreshTokens[0], 2, 1);
      validateResolvedRefreshToken(resolvedRefreshTokens[1], 3, 2);
      validateResolvedRefreshToken(resolvedRefreshTokens[2], 3, 3);
    });

    it('should fail when refresh token is inexistent', async () => {
      await userRepo.insert(userRepo.create(userData1));
      await userRepo.insert(userRepo.create(userData2));
      await userRepo.insert(userRepo.create(userData3));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      await refreshTokenRepo.delete(2);

      const fn = async () =>
        tokenService.resolveRefreshToken(generatedRefreshTokens[1]);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.NOT_FOUND);
      await expect(fn()).rejects.toThrow(NotFoundException);
    });

    it('should fail when user is inexistent', async () => {
      await userRepo.insert(userRepo.create(userData1));
      await userRepo.insert(userRepo.create(userData2));
      await userRepo.insert(userRepo.create(userData3));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      await userRepo.delete(3);

      const fn = async () =>
        tokenService.resolveRefreshToken(generatedRefreshTokens[1]);
      await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
      await expect(fn()).rejects.toThrow(NotFoundException);
    });

    it('should fail when refresh token is null', async () => {
      const fn = async () => tokenService.resolveRefreshToken(null);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when refresh token is undefined', async () => {
      const fn = async () => tokenService.resolveRefreshToken(undefined);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when refresh token is empty', async () => {
      const fn = async () => tokenService.resolveRefreshToken('');
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when refresh token is invalid', async () => {
      const fn = async () =>
        tokenService.resolveRefreshToken('invalid_refresh_token');
      await expect(fn()).rejects.toThrow('jwt malformed');
      await expect(fn()).rejects.toThrow(JsonWebTokenError);
    });
  });

  describe('decodeRefreshToken', () => {
    function validateDecodedRefreshToken(
      decodeRefreshToken: any, // TODO: DTO
      userId: number,
      refreshTokenId: number,
    ) {
      expect(decodeRefreshToken).toBeDefined();
      expect(decodeRefreshToken.sub).toEqual(`${userId}`);
      expect(decodeRefreshToken.jti).toEqual(`${refreshTokenId}`);
      expect(decodeRefreshToken.exp).toBeDefined();
      expect(typeof decodeRefreshToken.exp).toEqual('number');
      expect(decodeRefreshToken.iat).toBeDefined();
      expect(typeof decodeRefreshToken.iat).toEqual('number');
      expect(decodeRefreshToken.iat).toBeLessThan(decodeRefreshToken.exp);
    }

    it('should decode refresh token', async () => {
      const users = [new UserEntity(), new UserEntity(), new UserEntity()];
      users[0].id = 1;
      users[1].id = 2;
      users[2].id = 3;

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      const refreshTokens = await refreshTokenRepo.find();

      const decodedRefreshTokens = [
        await tokenService['decodeRefreshToken'](generatedRefreshTokens[0]),
        await tokenService['decodeRefreshToken'](generatedRefreshTokens[1]),
        await tokenService['decodeRefreshToken'](generatedRefreshTokens[2]),
      ];

      validateDecodedRefreshToken(decodedRefreshTokens[0], 2, 1);
      validateDecodedRefreshToken(decodedRefreshTokens[1], 3, 2);
      validateDecodedRefreshToken(decodedRefreshTokens[2], 3, 3);

      expect(refreshTokens).toHaveLength(3);
    });

    it('should fail when access token is null', async () => {
      const fn = async () => await tokenService['decodeRefreshToken'](null);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when access token is undefined', async () => {
      const fn = async () =>
        await tokenService['decodeRefreshToken'](undefined);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when access token is empty', async () => {
      const fn = async () => await tokenService['decodeRefreshToken']('');
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when access token is invalid', async () => {
      const fn = async () =>
        await tokenService['decodeRefreshToken']('invalid_token');
      await expect(fn()).rejects.toThrow('jwt malformed');
      await expect(fn()).rejects.toThrow(JsonWebTokenError);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token', async () => {
      const userData = [
        { ...userData1, active: true },
        { ...userData2, active: true },
        { ...userData3, active: true },
      ];
      await userRepo.insert(userRepo.create(userData[0]));
      await userRepo.insert(userRepo.create(userData[1]));
      await userRepo.insert(userRepo.create(userData[2]));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      await tokenService.revokeRefreshToken(generatedRefreshTokens[1]);

      const refreshTokens = await refreshTokenRepo.find();
      expect(refreshTokens[0].revoked).toEqual(false);
      expect(refreshTokens[1].revoked).toEqual(true);
      expect(refreshTokens[2].revoked).toEqual(false);
    });

    it('should fail when refresh token is inexistent', async () => {
      await userRepo.insert(userRepo.create(userData1));
      await userRepo.insert(userRepo.create(userData2));
      await userRepo.insert(userRepo.create(userData3));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      const refreshTokens = await refreshTokenRepo.find();
      await refreshTokenRepo.remove(refreshTokens[1]);

      const fn = async (refreshToken: string) =>
        await tokenService.revokeRefreshToken(refreshToken);

      await expect(fn(generatedRefreshTokens[1])).rejects.toThrow(
        RefreshTokenMessage.NOT_FOUND,
      );
      await expect(fn(generatedRefreshTokens[1])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should fail when token is null', async () => {
      const fn = async (refreshToken: string) =>
        await tokenService.revokeRefreshToken(refreshToken);
      await expect(fn(null)).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn(null)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when token is undefined', async () => {
      const fn = async (refreshToken: string) =>
        await tokenService.revokeRefreshToken(refreshToken);
      await expect(fn(undefined)).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn(undefined)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when token is empty', async () => {
      const fn = async (refreshToken: string) =>
        await tokenService.revokeRefreshToken(refreshToken);
      await expect(fn('')).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn('')).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when token is invalid', async () => {
      const fn = async (refreshToken: string) =>
        await tokenService.revokeRefreshToken(refreshToken);
      await expect(fn('invalid_refresh_token')).rejects.toThrow(
        'jwt malformed',
      );
      await expect(fn('invalid_refresh_token')).rejects.toThrow(
        JsonWebTokenError,
      );
    });
  });

  describe('createAccessTokenFromRefreshToken', () => {
    it('should create access token from refresh token', async () => {
      const userId = 3;
      await userRepo.insert(userRepo.create(userData1));
      await userRepo.insert(userRepo.create(userData2));
      await userRepo.insert(userRepo.create(userData3));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      const accessToken = await tokenService.createAccessTokenFromRefreshToken(
        generatedRefreshTokens[1],
      );

      expect(accessToken).toBeDefined();
      expect(accessToken.user).toBeDefined();
      expect(accessToken.user).toBeInstanceOf(UserEntity);
      expect(accessToken.user.id).toEqual(userId);
      expect(accessToken.token).toBeDefined();
      expect(typeof accessToken.token).toEqual('string');

      const decodedAccessToken = await jwtService.decode(accessToken.token);
      expect(decodedAccessToken['sub']).toBeDefined();
      expect(decodedAccessToken['exp']).toBeDefined();
      expect(decodedAccessToken['iat']).toBeDefined();
      expect(decodedAccessToken['sub']).toEqual(`${userId}`);
      expect(decodedAccessToken['exp']).toBeGreaterThan(
        decodedAccessToken['iat'],
      );
    });

    it('should fail when refresh token is revoked', async () => {
      const usersData = [
        { ...userData1, active: true },
        { ...userData2, active: true },
        { ...userData3, active: true },
      ];
      const refreshTokendId = 2;
      await userRepo.insert(userRepo.create(usersData[0]));
      await userRepo.insert(userRepo.create(usersData[1]));
      await userRepo.insert(userRepo.create(usersData[2]));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      await tokenService.revokeRefreshToken(generatedRefreshTokens[1]);

      const fn = async (refreshToken) =>
        await tokenService.createAccessTokenFromRefreshToken(refreshToken);

      await expect(fn(generatedRefreshTokens[1])).rejects.toThrow(
        RefreshTokenMessage.INVALID,
      );
      await expect(fn(generatedRefreshTokens[1])).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should fail when refresh token is inexistent', async () => {
      const refreshTokendId = 2;
      await userRepo.insert(userRepo.create(userData1));
      await userRepo.insert(userRepo.create(userData2));
      await userRepo.insert(userRepo.create(userData3));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      await refreshTokenRepo.delete(refreshTokendId);

      const fn = async (refreshToken) =>
        await tokenService.createAccessTokenFromRefreshToken(refreshToken);

      await expect(fn(generatedRefreshTokens[1])).rejects.toThrow(
        RefreshTokenMessage.NOT_FOUND,
      );
      await expect(fn(generatedRefreshTokens[1])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should fail when user is inexistent', async () => {
      await userRepo.insert(userRepo.create(userData1));
      await userRepo.insert(userRepo.create(userData2));
      await userRepo.insert(userRepo.create(userData3));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      await userRepo.delete(1);
      await userRepo.delete(2);
      await userRepo.delete(3);

      const fn = async (refreshToken) =>
        await tokenService.createAccessTokenFromRefreshToken(refreshToken);

      await expect(fn(generatedRefreshTokens[1])).rejects.toThrow(
        UserMessage.NOT_FOUND,
      );
      await expect(fn(generatedRefreshTokens[1])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should fail when refresh token is null', async () => {
      const fn = async () =>
        tokenService.createAccessTokenFromRefreshToken(null);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when refresh token is undefined', async () => {
      const fn = async () =>
        tokenService.createAccessTokenFromRefreshToken(undefined);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when refresh token is empty', async () => {
      const fn = async () => tokenService.createAccessTokenFromRefreshToken('');
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when refresh token is invalid', async () => {
      const fn = async () =>
        tokenService.createAccessTokenFromRefreshToken('invalid_refresh_token');
      await expect(fn()).rejects.toThrow('jwt malformed');
      await expect(fn()).rejects.toThrow(JsonWebTokenError);
    });
  });

  describe('getUserFromRefreshTokenPayload', () => {
    it('should get user from refresh token payload', async () => {
      await userRepo.insert(userRepo.create(userData1));
      await userRepo.insert(userRepo.create(userData2));
      await userRepo.insert(userRepo.create(userData3));

      const users = await userRepo.find();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      const decodedRefreshTokens = [
        await tokenService['decodeRefreshToken'](generatedRefreshTokens[0]),
        await tokenService['decodeRefreshToken'](generatedRefreshTokens[1]),
        await tokenService['decodeRefreshToken'](generatedRefreshTokens[2]),
      ];

      const usersFromPayload = [
        await tokenService['getUserFromRefreshTokenPayload'](
          decodedRefreshTokens[0],
        ),
        await tokenService['getUserFromRefreshTokenPayload'](
          decodedRefreshTokens[1],
        ),
        await tokenService['getUserFromRefreshTokenPayload'](
          decodedRefreshTokens[2],
        ),
      ];

      expect(usersFromPayload[0]).toBeInstanceOf(UserEntity);
      expect(usersFromPayload[1]).toBeInstanceOf(UserEntity);
      expect(usersFromPayload[2]).toBeInstanceOf(UserEntity);

      expect(usersFromPayload[0].id).toEqual(2);
      expect(usersFromPayload[1].id).toEqual(3);
      expect(usersFromPayload[2].id).toEqual(3);
    });

    it('should return null when user is inexistent', async () => {
      await userRepo.insert(userRepo.create(userData1));
      const user = await userRepo.findOne({ where: { id: 1 } });
      const refreshToken = await tokenService.generateRefreshToken(user);
      const decodedRefreshToken = await tokenService['decodeRefreshToken'](
        refreshToken,
      );
      const fn = async () =>
        await tokenService['getUserFromRefreshTokenPayload']({
          exp: 1000,
          iat: 900,
          jti: 2,
          sub: '3',
        });
      await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
      await expect(fn()).rejects.toThrow(NotFoundException);
    });

    it('should fail when refresh token payload is null', async () => {
      const fn = async () =>
        await tokenService['getUserFromRefreshTokenPayload'](null);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.PAYLOAD_REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when refresh token payload is undefined', async () => {
      const fn = async () =>
        await tokenService['getUserFromRefreshTokenPayload'](undefined);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.PAYLOAD_REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when sub is missing in refresh token payload', async () => {
      const fn = async () =>
        await tokenService['getUserFromRefreshTokenPayload']({
          exp: 100,
          iat: 90,
          jti: 2,
          sub: null,
        });
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.MALFORMED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe.skip('getStoredTokenFromRefreshTokenPayload', () => {});
});