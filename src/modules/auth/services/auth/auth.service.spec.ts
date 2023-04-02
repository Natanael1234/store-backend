import { JwtModule, JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { UserService } from '../../../user/services/user/user.service';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { TokenService } from '../token/token.service';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JWTConfigs } from '../../configs/jwt.config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../../guards/jwt/jwt-auth.guard';
import { LocalStrategy } from '../../strategies/local/local.strategy';
import { UserEntity } from '../../../user/models/user/user.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnprocessableEntityException } from '@nestjs/common';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { JsonWebTokenError } from 'jsonwebtoken';

describe('AuthService', () => {
  let module: TestingModule;
  let authService: AuthService;
  let jwtService: JwtService;
  let userService: UserService;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<UserEntity>;
  let tokenService: TokenService;

  const registerData = [
    {
      name: 'User 1',
      password: '123',
      email: 'user1@email.com',
      acceptTerms: true,
    },
    {
      name: 'User 2',
      password: '1234',
      email: 'user2@email.com',
      acceptTerms: true,
    },
    {
      name: 'User 3',
      password: '12345',
      email: 'user3@email.com',
      acceptTerms: true,
    },
  ];

  beforeEach(async () => {
    module = await getTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PassportModule,
        JwtModule.register({
          secret: JWTConfigs.ACCESS_TOKEN_SECRET,
          signOptions: {
            expiresIn: JWTConfigs.ACCESS_TOKEN_EXPIRATION,
          },
        }),
      ],
      providers: [
        RefreshTokenRepository,
        UserService,
        LocalStrategy,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        TokenService,
        AuthService,
      ],
    });

    jwtService = module.get<JwtService>(JwtService);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    tokenService = module.get<TokenService>(TokenService);
    refreshTokenRepo = module.get<RefreshTokenRepository>(
      RefreshTokenRepository,
    );
    refreshTokenRepo = module.get<RefreshTokenRepository>(
      RefreshTokenRepository,
    );
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  function validateDecodedAccessToken(decodedAccessToken, userId) {
    expect(decodedAccessToken).toBeDefined();
    expect(decodedAccessToken['sub']).toEqual(`${userId}`);
    expect(decodedAccessToken['exp']).toBeDefined();
    expect(decodedAccessToken['iat']).toBeDefined();
    // TODO: validate times
  }

  function validateDecodedRefreshToken(decodedRefreshToken, userId) {
    expect(decodedRefreshToken).toBeDefined();
    expect(decodedRefreshToken['sub']).toEqual(`${userId}`);
    expect(decodedRefreshToken['iat']).toBeDefined();
    expect(decodedRefreshToken['exp']).toBeDefined();
    expect(decodedRefreshToken['exp']).toBeGreaterThanOrEqual(
      decodedRefreshToken['iat'],
    );
    // TODO: validate times
  }

  function validatePayload(payload, userId) {
    expect(payload).toBeDefined();
    expect(payload.type).toEqual('bearer');
    expect(payload.token).toBeDefined();
    expect(payload.refreshToken).toBeDefined();
    const decodedAccessToken = jwtService.decode(payload.token);
    const decodedRefreshToken = jwtService.decode(payload.refreshToken);
    validateDecodedAccessToken(decodedAccessToken, userId);
    validateDecodedRefreshToken(decodedRefreshToken, userId);
  }

  function validateUser(user, expectedUserData) {
    expect(user).toBeDefined();
    expect(user.id).toEqual(expectedUserData.id);
    expect(user.email).toEqual(expectedUserData.email);
    expect(user.name).toEqual(expectedUserData.name);
    expect(user.hash).toBeUndefined();
    expect(user.created).toBeDefined();
    expect(user.updated).toBeDefined();
    expect(user.deletedAt).toBeNull();
  }

  function validateAuthResponse(
    response,
    expectedUserData: { id: number; name: string; email: string },
  ) {
    expect(response).toBeDefined();
    expect(response.status).toEqual('success');
    expect(response.data).toBeDefined();
    validateUser(response.data.user, expectedUserData);
    validatePayload(response.data.payload, response.data.user.id);
  }

  function checkDistinctTokens(payload1, payload2) {
    expect(payload1.token).not.toEqual(payload1.refreshToken);
    expect(payload2.token).not.toEqual(payload2.refreshToken);

    expect(payload1.token).not.toEqual(payload2.token);
    expect(payload1.token).not.toEqual(payload2.refreshToken);
    expect(payload1.refreshToken).not.toEqual(payload2.token);
    expect(payload1.refreshToken).not.toEqual(payload2.refreshToken);
  }

  describe('register', () => {
    it('should register users', async () => {
      const response1 = await authService.register(registerData[0]);
      const response2 = await authService.register(registerData[1]);

      await userService.create({
        name: 'Another user',
        email: 'anotheruser@email.com',
        password: 'abc',
      });
      const response3 = await authService.register(registerData[2]);

      const refreshTokens = await refreshTokenRepo.find();
      const users = await userRepo.find();

      expect(refreshTokens).toHaveLength(3);
      expect(users).toHaveLength(4);

      validateAuthResponse(response1, {
        id: 1,
        name: registerData[0].name,
        email: 'user1@email.com',
      });
      validateAuthResponse(response2, {
        id: 2,
        name: registerData[1].name,
        email: 'user2@email.com',
      });
      validateAuthResponse(response3, {
        id: 4,
        name: registerData[2].name,
        email: 'user3@email.com',
      });

      checkDistinctTokens(response1.data.payload, response2.data.payload);
      checkDistinctTokens(response1.data.payload, response3.data.payload);
      checkDistinctTokens(response2.data.payload, response3.data.payload);
    });

    it.each([{ data: null }, { data: undefined }])(
      'should fail when data is $data',
      async ({ data }) => {
        const fn = async () => await authService.register(data);
        await expect(fn()).rejects.toThrow('User data is required');
        await expect(fn()).rejects.toThrow(BadRequestException);
      },
    );

    describe('name', () => {
      it.each([{ name: null }, { name: undefined }])(
        'should fail when name is $name',
        async ({ name }) => {
          const fn = async () =>
            await authService.register({ ...registerData[1], name });
          await expect(fn()).rejects.toThrow('Name is required');
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });

    describe('email', () => {
      it('should fail when email is already registered', async () => {
        const response1 = await authService.register(registerData[0]);
        const fn = async () =>
          await authService.register({
            ...registerData[1],
            email: registerData[0].email,
          });
        await expect(fn()).rejects.toThrow(
          'SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email',
        );
        await expect(fn()).rejects.toThrow(QueryFailedError);
      });

      it('should fail when email is already registered for user is soft-deleted', async () => {
        await authService.register(registerData[0]);
        await authService.register(registerData[1]);
        await userRepo.softDelete(2);
        const fn = () => authService.register(registerData[1]);
        await expect(fn()).rejects.toThrow(
          'SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email',
        );
        await expect(fn()).rejects.toThrow(QueryFailedError);
      });

      it.each([{ email: null }, { email: undefined }])(
        'should fail when email is $email',
        async ({ email }) => {
          const fn = async () =>
            await authService.register({ ...registerData[1], email });
          await expect(fn()).rejects.toThrow('Email is required');
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });

    describe('password', () => {
      it.each([{ password: null }, { password: undefined }])(
        'should fail when password is $password',
        async ({ password }) => {
          const fn = async () =>
            await authService.register({ ...registerData[1], password });
          await expect(fn()).rejects.toThrow('Password is required');
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });

    describe('acceptTerms', () => {
      it.each([{ acceptTerms: null }, { acceptTerms: undefined }])(
        'should not fail when acceptTerms is $acceptTerms',
        async ({ acceptTerms }) => {
          const ret = await authService.register({
            ...registerData[1],
            acceptTerms,
          });
          expect(ret).toBeDefined();
        },
      );
    });
  });

  describe('login', () => {
    it('should login', async () => {
      await authService.register(registerData[0]);
      await authService.register(registerData[1]);
      const createUserData = {
        name: 'Another user',
        email: 'anotheruser@email.com',
        password: 'abc',
        acceptTerms: true,
      };
      await userService.create(createUserData);
      await authService.register(registerData[2]);

      const loginRet1 = await authService.login({
        email: registerData[1].email,
        password: registerData[1].password,
      });

      const loginRet2 = await authService.login({
        email: createUserData.email,
        password: createUserData.password,
      });

      // prevents tokens for the same user to be equal due to be generated at the same time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const loginRet3 = await authService.login({
        email: createUserData.email,
        password: createUserData.password,
      });

      validateAuthResponse(loginRet1, {
        id: 2,
        name: registerData[1].name,
        email: registerData[1].email,
      });

      validateAuthResponse(loginRet2, {
        id: 3,
        name: createUserData.name,
        email: createUserData.email,
      });

      validateAuthResponse(loginRet3, {
        id: 3,
        name: createUserData.name,
        email: createUserData.email,
      });

      checkDistinctTokens(loginRet1.data.payload, loginRet2.data.payload);
      checkDistinctTokens(loginRet1.data.payload, loginRet3.data.payload);
      checkDistinctTokens(loginRet2.data.payload, loginRet3.data.payload);
    });

    it.each([{ loginData: null }, { loginData: undefined }])(
      'should fail when login data is $loginData',
      async ({ loginData }) => {
        const fn = () => authService.login(loginData);
        await expect(fn()).rejects.toThrow('User credentials is required');
        await expect(fn()).rejects.toThrow(BadRequestException);
      },
    );

    it('should fail when user is soft-deleted', async () => {
      await authService.register(registerData[0]);
      await authService.register(registerData[1]);
      await userRepo.softDelete(2);
      const fn = () =>
        authService.login({
          email: registerData[1].email,
          password: registerData[1].password,
        });
      await expect(fn()).rejects.toThrow('The login is invalid');
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    describe('email', () => {
      it.each([
        { emailDescription: null, email: null },
        { emailDescription: undefined, email: undefined },
        { emailDescription: 'empty', email: '' },
      ])('should fail when email is $emailDescription', async ({ email }) => {
        const fn = () => authService.login({ email, password: '123' });
        await expect(fn()).rejects.toThrow('Email is required');
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when email is not found', async () => {
        await authService.register(registerData[0]);
        await authService.register(registerData[1]);
        const fn = () =>
          authService.login({
            email: 'inexistentuser@email.com',
            password: '123',
          });
        await expect(fn()).rejects.toThrow('The login is invalid');
        await expect(fn()).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('password', () => {
      it.each([
        { passwordDescription: null, password: null },
        { passwordDescription: undefined, password: undefined },
        { passwordDescription: 'empty', password: '' },
      ])(
        'should fail when email is $passwordDescription',
        async ({ password }) => {
          const fn = () =>
            authService.login({ email: registerData[1].email, password });
          await expect(fn()).rejects.toThrow('Password is required');
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });

    it('should fail when password is wrong', async () => {
      await authService.register(registerData[0]);
      await authService.register(registerData[1]);
      const fn = () =>
        authService.login({
          email: registerData[1].email,
          password: 'wrong_password',
        });
      await expect(fn()).rejects.toThrow('The login is invalid');
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh login', async () => {
      const registerResponses = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
        await authService.register(registerData[2]),
      ];

      const refreshResponses = [
        await authService.refresh(
          registerResponses[0].data.payload.refreshToken,
        ),
        await authService.refresh(
          registerResponses[1].data.payload.refreshToken,
        ),
        await authService.refresh(
          registerResponses[1].data.payload.refreshToken,
        ),
      ];

      const decodedAccessTokens = [
        await jwtService.decode(refreshResponses[0].data.payload.token),
        await jwtService.decode(refreshResponses[1].data.payload.token),
        await jwtService.decode(refreshResponses[2].data.payload.token),
      ];

      validateDecodedAccessToken(decodedAccessTokens[0], 1);
      validateDecodedAccessToken(decodedAccessTokens[1], 2);
      validateDecodedAccessToken(decodedAccessTokens[2], 2);
    });

    it.each([
      { refreshTokenDescription: null, refreshToken: null },
      { refreshTokenDescription: undefined, refreshToken: undefined },
      { refreshTokenDescription: 'empty', refreshToken: '' },
    ])(
      'should fail when refresh token is $refreshTokenDescription',
      async ({ refreshToken }) => {
        await authService.register(registerData[0]);
        const fn = async () => await authService.refresh(refreshToken);
        await expect(fn()).rejects.toThrow('Refresh token is required');
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      },
    );

    it('should fail when refresh token is invalid', async () => {
      await authService.register(registerData[0]);
      const fn = async () => await authService.refresh('invalid_refresh_token');
      await expect(fn()).rejects.toThrow('jwt malformed');
      await expect(fn()).rejects.toThrow(JsonWebTokenError);
    });

    it('should fail when refresh token is blacklisted', async () => {
      const registered = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
      ];

      await tokenService.revokeRefreshToken(
        registered[1].data.payload.refreshToken,
      );

      const refreshed = await authService.refresh(
        registered[0].data.payload.refreshToken,
      );

      expect(refreshed).toBeDefined();

      const fn = async (refreshToken) =>
        await authService.refresh(refreshToken);
      await expect(fn(registered[1].data.payload.refreshToken)).rejects.toThrow(
        'Invalid refresh token',
      );
      await expect(fn(registered[1].data.payload.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should fail when refresh token is user is soft-deleted', async () => {
      const registered = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
      ];
      await userRepo.softDelete(2);
      const fn = () =>
        authService.refresh(registered[1].data.payload.refreshToken);
      expect(fn()).rejects.toThrow('User not found');
      expect(fn()).rejects.toThrow(NotFoundException);
    });
  });

  describe('logout', () => {
    it('should logout', async () => {
      const registered = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
        await authService.register(registerData[2]),
      ];

      const logoutsResults = [
        await authService.logout(registered[1].data.payload.refreshToken),
      ];

      const refreshTokens = await refreshTokenRepo.find();

      expect(logoutsResults[0]).toEqual(true);
      expect(refreshTokens).toHaveLength(3);
      expect(refreshTokens[0].revoked).toEqual(false);
      expect(refreshTokens[1].revoked).toEqual(true);
      expect(refreshTokens[2].revoked).toEqual(false);
    });

    it.each([
      { refreshTokenDescription: null, refreshToken: null },
      { refreshTokenDescription: undefined, refreshToken: undefined },
      { refreshTokenDescription: 'empty', refreshToken: '' },
    ])(
      'should fail when refresh token is $refreshTokenDescription',
      async ({ refreshToken }) => {
        await authService.register(registerData[0]);
        const fn = async () => authService.logout(refreshToken);
        await expect(fn).rejects.toThrow('Refresh token is required');
        await expect(fn).rejects.toThrow(UnprocessableEntityException);
      },
    );

    it('should fail when refresh token is blacklisted', async () => {
      const registerResponses = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
        await authService.register(registerData[2]),
      ];

      await tokenService.revokeRefreshToken(
        registerResponses[1].data.payload.refreshToken,
      );

      const fn = async () =>
        authService.logout(registerResponses[1].data.payload.refreshToken);
      await expect(fn).rejects.toThrow('Invalid refresh token');
      await expect(fn).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is user is soft-deleted', async () => {
      const registerResponses = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
        await authService.register(registerData[2]),
      ];
      await userRepo.softDelete(2);
      const fn = async () =>
        authService.logout(registerResponses[1].data.payload.refreshToken);
      expect(fn()).rejects.toThrow('User not found');
      expect(fn()).rejects.toThrow(NotFoundException);
      // TODO: deveria retornar null
    });
  });

  describe('buildResponsePayload', () => {
    it('should build response payload', async () => {
      const user = new UserEntity();
      user.id = 100;
      user.hash = undefined;
      const token = 'accessToken';
      const refreshToken = 'refreshToken';
      const responsePayload = await authService['buildResponsePayload'](
        user,
        token,
        refreshToken,
      );
      expect(responsePayload).toMatchObject({
        user,
        payload: {
          type: 'bearer',
          token,
          refreshToken,
        },
      });
    });

    describe('user', () => {
      it.each([{ user: null }, { user: undefined }])(
        'should fail when user is $user',
        async ({ user }) => {
          const fn = async () => {
            await authService['buildResponsePayload'](
              user,
              'accessToken',
              'refreshToken',
            );
          };
          await expect(fn()).rejects.toThrow('User is required');
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );

      it('should fail when user id is not defined', async () => {
        const fn = async () => {
          await authService['buildResponsePayload'](
            new UserEntity(),
            'accessToken',
            'refreshToken',
          );
        };
        await expect(fn()).rejects.toThrow('User id is required');
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });
    });

    describe('access token', () => {
      it.each([
        { accessTokenDescription: null, accessToken: null },
        { accessTokenDescription: undefined, accessToken: undefined },
        { accessTokenDescription: 'empty', accessToken: '' },
      ])(
        'should fail when access token is $accessTokenDescription',
        async ({ accessToken }) => {
          const fn = async () => {
            await authService['buildResponsePayload'](
              new UserEntity(),
              accessToken,
              'refreshToken',
            );
          };
          await expect(fn()).rejects.toThrow('User id is required');
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });

    describe('refresh token', () => {
      it.each([
        { refreshTokenDescription: null, refreshToken: null },
        { refreshTokenDescription: undefined, refreshToken: undefined },
        { refreshTokenDescription: 'empty', refreshToken: '' },
      ])(
        'should build response payload when refresh token is $refreshTokenDescription',
        async ({ refreshToken }) => {
          const user = new UserEntity();
          user.id = 100;
          user.hash = undefined;
          const token = 'accessToken';
          const responsePayload = await authService['buildResponsePayload'](
            user,
            token,
            refreshToken,
          );
          expect(responsePayload).toMatchObject({
            user,
            payload: {
              type: 'bearer',
              token,
              ...(refreshToken ? { refreshToken: refreshToken } : {}),
            },
          });
        },
      );
    });
  });
});
