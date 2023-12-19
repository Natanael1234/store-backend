import {
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JsonWebTokenError } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { UserConstants } from '../../../user/constants/user/user-entity.constants';
import { UserMessage } from '../../../user/enums/messages/user/user.messages.enum';
import { User } from '../../../user/models/user/user.entity';
import { Role } from '../../enums/role/role.enum';
import { RefreshTokenMessage } from '../../messages/refresh-token/refresh-token.messages.enum';
import { RefreshToken } from '../../models/refresh-token.entity';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { TokenService } from './token.service';

describe('TokenServiceService', () => {
  let module: TestingModule;
  let userRepo: Repository<User>;
  let refreshTokenRepo: RefreshTokenRepository;
  let tokenService: TokenService;
  let jwtService: JwtService;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    module = await getTestingModule();
    tokenService = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    refreshTokenRepo = module.get<RefreshTokenRepository>(
      RefreshTokenRepository,
    );
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

  describe('generateAccessToken', () => {
    it('should generate an access token', async () => {
      await insertUsers({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Acbd*1',
        roles: [Role.ROOT],
        active: true,
      });

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

      const accessToken = await tokenService.generateAccessToken(users[0]);
      expect(accessToken).toBeDefined();
      expect(accessToken.length).toBeGreaterThanOrEqual(20); // TODO: size unknown

      const decodedAccessToken = await jwtService.decode(accessToken);
      expect(decodedAccessToken['sub']).toBeDefined();
      expect(decodedAccessToken['exp']).toBeDefined();
      expect(decodedAccessToken['iat']).toBeDefined();
      expect(decodedAccessToken['sub']).toEqual(`${users[0].id}`);
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
      const fn = async () => tokenService.generateAccessToken(new User());
      await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate an refresh token', async () => {
      await insertUsers({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Acbd*1',
        roles: [Role.ROOT],
        active: true,
      });

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

      const refreshToken = await tokenService.generateRefreshToken(users[0]);
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
      const fn = async () => tokenService.generateRefreshToken(new User());
      await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
    });
  });

  describe('resolveRefreshToken', () => {
    function validateResolvedRefreshToken(
      resolved: { refreshToken: any; user: any },
      userId: string,
      refreshTokenId: number,
    ) {
      expect(resolved).toBeDefined();
      expect(resolved.refreshToken).toBeDefined();
      expect(resolved.refreshToken).toBeInstanceOf(RefreshToken);
      expect(resolved.refreshToken.id).toEqual(refreshTokenId);
      expect(resolved.refreshToken.userId).toEqual(userId);
      expect(resolved.user).toBeDefined();
      expect(resolved.user).toBeInstanceOf(User);
      expect(resolved.user.id).toEqual(userId);
    }

    it('should resolve refresh token', async () => {
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
          active: true,
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

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
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
      validateResolvedRefreshToken(resolvedRefreshTokens[0], userId2, 1);
      validateResolvedRefreshToken(resolvedRefreshTokens[1], userId3, 2);
      validateResolvedRefreshToken(resolvedRefreshTokens[2], userId3, 3);
    });

    it('should fail when refresh token is inexistent', async () => {
      await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
          active: true,
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
      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[0]),
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
      ];
      await refreshTokenRepo.delete(2);
      const fn = async () =>
        tokenService.resolveRefreshToken(generatedRefreshTokens[1]);
      await expect(fn()).rejects.toThrow(RefreshTokenMessage.NOT_FOUND);
      await expect(fn()).rejects.toThrow(NotFoundException);
    });

    it('should fail when user is inexistent', async () => {
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
          active: true,
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

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];
      await userRepo.delete(userId3);
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
      userId: string,
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
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
          active: true,
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

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[0]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];
      const refreshTokens = await refreshTokenRepo.find();
      const decodedRefreshTokens = [
        await tokenService['decodeRefreshToken'](generatedRefreshTokens[0]),
        await tokenService['decodeRefreshToken'](generatedRefreshTokens[1]),
        await tokenService['decodeRefreshToken'](generatedRefreshTokens[2]),
      ];
      validateDecodedRefreshToken(decodedRefreshTokens[0], userId1, 1);
      validateDecodedRefreshToken(decodedRefreshTokens[1], userId3, 2);
      validateDecodedRefreshToken(decodedRefreshTokens[2], userId3, 3);
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
      await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
          active: true,
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
      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();
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
      await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
          active: true,
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
      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

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
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
          active: true,
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

      const userId = userId3;

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

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
      expect(accessToken.user).toBeInstanceOf(User);
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
      const { identifiers: userIdentifiers } = await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            hash: await encryptionService.encrypt('Acbd*1'),
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            hash: await encryptionService.encrypt('Acbd*2'),
            roles: [Role.ADMIN],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            hash: await encryptionService.encrypt('Acbd*2'),
            roles: [Role.USER],
            active: true,
          },
        ])
        .execute();

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

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
      const refreshTokendId = 2; // inexistent refresh token id
      const { identifiers: userIdentifiers } = await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            hash: await encryptionService.encrypt('Acbd*1'),
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            hash: await encryptionService.encrypt('Acbd*2'),
            roles: [Role.ADMIN],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            hash: await encryptionService.encrypt('Acbd*2'),
            roles: [Role.USER],
            active: true,
          },
        ])
        .execute();

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

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
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
          active: true,
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

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

      const generatedRefreshTokens = [
        await tokenService.generateRefreshToken(users[1]),
        await tokenService.generateRefreshToken(users[2]),
        await tokenService.generateRefreshToken(users[2]),
      ];

      await userRepo.delete(userId1);
      await userRepo.delete(userId2);
      await userRepo.delete(userId3);

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
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Acbd*1',
          roles: [Role.ROOT],
          active: true,
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

      const users = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .getMany();

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

      expect(usersFromPayload[0]).toBeInstanceOf(User);
      expect(usersFromPayload[1]).toBeInstanceOf(User);
      expect(usersFromPayload[2]).toBeInstanceOf(User);

      expect(usersFromPayload[0].id).toEqual(userId2);
      expect(usersFromPayload[1].id).toEqual(userId3);
      expect(usersFromPayload[2].id).toEqual(userId3);
    });

    // TODO: verificar se a descrição está certa
    it('should return null when user is inexistent (in refresh tokens)', async () => {
      const { identifiers: userIdentifiers } = await userRepo
        .createQueryBuilder()
        .insert()
        .values({
          name: 'User 1',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          hash: await encryptionService.encrypt('Abcd*1'),
        })
        .execute();
      const user = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .where(UserConstants.USER_ID_EQUALS_TO, {
          userId: userIdentifiers[0].id,
        })
        .getOne();

      const refreshToken = await tokenService.generateRefreshToken(user);
      const decodedRefreshToken = await tokenService['decodeRefreshToken'](
        refreshToken,
      );
      const fn = async () =>
        await tokenService['getUserFromRefreshTokenPayload']({
          exp: 1000,
          iat: 900,
          jti: 2,
          sub: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
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
