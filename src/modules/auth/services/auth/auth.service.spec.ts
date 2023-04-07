import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { UserService } from '../../../user/services/user/user.service';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { TokenService } from '../token/token.service';
import { AuthService } from './auth.service';
import { UserEntity } from '../../../user/models/user/user.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnprocessableEntityException } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { JsonWebTokenError } from 'jsonwebtoken';
import {
  testLogin,
  testLogout,
  testRefresh,
  testRegister,
} from './auth-test-utils';
import { UserMessage } from '../../../user/enums/user-messages.ts/user-messages.enum';
import { PasswordMessage } from '../../../user/enums/password-messages/password-messages.enum';
import { CredentialsMessage } from '../../enums/cretentials-messages.ts/credentials-messages.enum';
import { RefreshTokenMessage } from '../../enums/refresh-token-messages.ts/refresh-token-messages.enum';
import { NameMessage } from '../../../user/enums/name-messages/name-messages.enum';
import { EmailMessage } from '../../../user/enums/email-messages/email-messages.enum';

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
    module = await getTestingModule();
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

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('register', () => {
    it('should register users', async () => {
      await testRegister(
        userService,
        userRepo,
        refreshTokenRepo,
        jwtService,
        (data: any) => authService.register(data),
      );
    });

    it.each([{ data: null }, { data: undefined }])(
      'should fail when data is $data',
      async ({ data }) => {
        const fn = async () => await authService.register(data);
        await expect(fn()).rejects.toThrow(UserMessage.DATA_REQUIRED);
        await expect(fn()).rejects.toThrow(BadRequestException);
      },
    );

    describe('name', () => {
      it.each([{ name: null }, { name: undefined }])(
        'should fail when name is $name',
        async ({ name }) => {
          const fn = async () =>
            await authService.register({ ...registerData[1], name });
          await expect(fn()).rejects.toThrow(NameMessage.REQUIRED);
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
        await expect(fn()).rejects.toThrow(EmailMessage.INVALID);
        await expect(fn()).rejects.toThrow(ConflictException);
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
          await expect(fn()).rejects.toThrow(EmailMessage.REQUIRED);
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
          await expect(fn()).rejects.toThrow(PasswordMessage.REQUIRED);
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
      await testLogin(userService, authService, jwtService, (data) =>
        authService.login(data),
      );
    });

    it.each([{ loginData: null }, { loginData: undefined }])(
      'should fail when login data is $loginData',
      async ({ loginData }) => {
        const fn = () => authService.login(loginData);
        await expect(fn()).rejects.toThrow(CredentialsMessage.REQUIRED);
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
      await expect(fn()).rejects.toThrow(CredentialsMessage.INVALID);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    describe('email', () => {
      it.each([
        { emailDescription: null, email: null },
        { emailDescription: undefined, email: undefined },
        { emailDescription: 'empty', email: '' },
      ])('should fail when email is $emailDescription', async ({ email }) => {
        const fn = () => authService.login({ email, password: '123' });
        await expect(fn()).rejects.toThrow(EmailMessage.REQUIRED);
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
        await expect(fn()).rejects.toThrow(CredentialsMessage.INVALID);
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
          await expect(fn()).rejects.toThrow(PasswordMessage.REQUIRED);
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
      await expect(fn()).rejects.toThrow(CredentialsMessage.INVALID);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh login', async () => {
      await testRefresh(authService, jwtService, (refreshToken) =>
        authService.refresh(refreshToken),
      );
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
        await expect(fn()).rejects.toThrow(RefreshTokenMessage.REQUIRED);
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
      expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
      expect(fn()).rejects.toThrow(NotFoundException);
    });
  });

  describe('logout', () => {
    it('should logout', async () => {
      await testLogout(authService, refreshTokenRepo, (refreshToken) =>
        authService.logout(refreshToken),
      );
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
        await expect(fn).rejects.toThrow(RefreshTokenMessage.REQUIRED);
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
      await expect(fn).rejects.toThrow(RefreshTokenMessage.INVALID);
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
      expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
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
          await expect(fn()).rejects.toThrow(UserMessage.REQUIRED);
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
        await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
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
          await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
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
