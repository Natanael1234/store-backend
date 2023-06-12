import { UnprocessableEntityException } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestUserData } from '../../../../test/user/test-user-data';
import { testValidateUser } from '../../../../test/user/test-user-utils';
import { AuthorizationMessage } from '../../../system/enums/messages/authorization-messages/authorization-messages.enum';
import { EmailMessage } from '../../../system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../../../system/enums/messages/name-messages/name-messages.enum';
import { PasswordMessage } from '../../../system/enums/messages/password-messages/password-messages.enum';
import { UserMessage } from '../../../user/enums/messages/user/user-messages.ts/user-messages.enum';
import { UserEntity } from '../../../user/models/user/user.entity';
import { UserService } from '../../../user/services/user/user.service';
import { CredentialsMessage } from '../../enums/cretentials-messages.ts/credentials-messages.enum';
import { Role } from '../../enums/role/role.enum';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { TokenService } from '../token/token.service';
import {
  testAuthenticationResponse,
  testDecodedAccessToken,
  testDistinctTokens,
} from './authentication-test-utils';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  let module: TestingModule;
  let authenticationService: AuthenticationService;
  let jwtService: JwtService;
  let userService: UserService;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<UserEntity>;
  let tokenService: TokenService;

  beforeEach(async () => {
    module = await getTestingModule();
    jwtService = module.get<JwtService>(JwtService);
    authenticationService = module.get<AuthenticationService>(
      AuthenticationService,
    );
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
    it.skip('should fail when user is inactive', async () => {});

    it('should register users', async () => {
      const registerData = TestUserData.registerData;
      const response1 = await authenticationService.register(registerData[0]);
      const response2 = await authenticationService.register(registerData[1]);
      const createData = {
        name: 'Another user',
        email: 'anotheruser@email.com',
        password: 'A123df*',
        roles: [Role.ADMIN],
        active: false,
      };
      await userService.create(createData);
      const response3 = await authenticationService.register(registerData[2]);

      const expectedUserData = [
        {
          id: 1,
          name: registerData[0].name,
          email: registerData[0].email,
          password: registerData[0].password,
          roles: [Role.ROOT],
          active: true,
        },
        {
          id: 2,
          name: registerData[1].name,
          email: registerData[1].email,
          password: registerData[1].password,
          roles: [Role.USER],
          active: true,
        },
        {
          id: 3,
          name: createData.name,
          email: createData.email,
          password: createData.password,
          roles: createData.roles,
          active: false,
        },
        {
          id: 4,
          name: registerData[2].name,
          email: registerData[2].email,
          password: registerData[2].password,
          roles: [Role.USER],
          active: true,
        },
      ];

      const repositoryRefreshTokens = await refreshTokenRepo.find();
      expect(repositoryRefreshTokens).toHaveLength(3);
      expect(repositoryRefreshTokens[0].userId).toEqual(1);
      expect(repositoryRefreshTokens[1].userId).toEqual(2);
      expect(repositoryRefreshTokens[2].userId).toEqual(4);

      const repositoryUsers = await userRepo.find();
      expect(repositoryUsers).toHaveLength(4);
      testValidateUser(repositoryUsers[0], expectedUserData[0]);
      testValidateUser(repositoryUsers[1], expectedUserData[1]);
      testValidateUser(repositoryUsers[2], expectedUserData[2]);
      testValidateUser(repositoryUsers[3], expectedUserData[3]);

      testAuthenticationResponse(jwtService, response1, expectedUserData[0]);
      testAuthenticationResponse(jwtService, response2, expectedUserData[1]);
      testAuthenticationResponse(jwtService, response3, expectedUserData[3]);

      // check if payloads are different
      testDistinctTokens(response1.data.payload, response2.data.payload);
      testDistinctTokens(response1.data.payload, response3.data.payload);
      testDistinctTokens(response2.data.payload, response3.data.payload);
    });

    it.each([{ data: null }, { data: undefined }])(
      'should fail when data is $data',
      async ({ data }) => {
        const fn = async () => await authenticationService.register(data);
        await expect(fn()).rejects.toThrow(UserMessage.DATA_REQUIRED);
        await expect(fn()).rejects.toThrow(BadRequestException);
      },
    );

    describe('name', () => {
      it.each([{ name: null }, { name: undefined }])(
        'should fail when name is $name',
        async ({ name }) => {
          const registerData = TestUserData.registerData;
          const fn = async () =>
            await authenticationService.register({ ...registerData[1], name });
          await expect(fn()).rejects.toThrow(NameMessage.REQUIRED);
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });

    describe('email', () => {
      it('should fail when email is already registered', async () => {
        const registerData = TestUserData.registerData;
        const response1 = await authenticationService.register(registerData[0]);
        const fn = async () =>
          await authenticationService.register({
            ...registerData[1],
            email: registerData[0].email,
          });
        await expect(fn()).rejects.toThrow(EmailMessage.INVALID);
        await expect(fn()).rejects.toThrow(ConflictException);
      });

      it('should fail when email is already registered for user is soft-deleted', async () => {
        const registerData = TestUserData.registerData;
        await authenticationService.register(registerData[0]);
        await authenticationService.register(registerData[1]);
        await userRepo.softDelete(2);
        const fn = () => authenticationService.register(registerData[1]);
        await expect(fn()).rejects.toThrow(EmailMessage.INVALID);
        await expect(fn()).rejects.toThrow(ConflictException);
      });

      it.each([{ email: null }, { email: undefined }])(
        'should fail when email is $email',
        async ({ email }) => {
          const registerData = TestUserData.registerData;
          const fn = async () =>
            await authenticationService.register({ ...registerData[1], email });
          await expect(fn()).rejects.toThrow(EmailMessage.REQUIRED);
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });

    describe('password', () => {
      it.each([{ password: null }, { password: undefined }])(
        'should fail when password is $password',
        async ({ password }) => {
          const registerData = TestUserData.registerData;
          const fn = async () =>
            await authenticationService.register({
              ...registerData[1],
              password,
            });
          await expect(fn()).rejects.toThrow(PasswordMessage.REQUIRED);
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });

    describe('acceptTerms', () => {
      it.each([{ acceptTerms: null }, { acceptTerms: undefined }])(
        'should not fail when acceptTerms is $acceptTerms',
        async ({ acceptTerms }) => {
          const registerData = TestUserData.registerData;
          const ret = await authenticationService.register({
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
      const registerData = TestUserData.registerData;
      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);

      const createUserData = {
        name: 'Another user',
        email: 'anotheruser@email.com',
        password: '123Acb*',
        roles: [Role.ADMIN],
        active: true,
      };
      await userService.create(createUserData);
      await authenticationService.register(registerData[2]);

      const expectedUserData = [
        {
          id: 1,
          name: registerData[0].name,
          email: registerData[0].email,
          password: registerData[0].password,
          roles: [Role.USER],
          active: true,
        },
        {
          id: 2,
          name: registerData[1].name,
          email: registerData[1].email,
          password: registerData[1].password,
          roles: [Role.USER],
          active: true,
        },
        {
          id: 3,
          name: createUserData.name,
          email: createUserData.email,
          password: createUserData.password,
          roles: [Role.ADMIN],
          active: true,
        },
        {
          id: 4,
          name: registerData[2].name,
          email: registerData[2].email,
          password: registerData[2].password,
          roles: [Role.USER],
          active: true,
        },
      ];

      const loginRet1 = await authenticationService.login({
        email: registerData[1].email,
        password: registerData[1].password,
      });

      const loginRet2 = await authenticationService.login({
        email: createUserData.email,
        password: createUserData.password,
      });

      // prevents tokens for the same user to be equal due to be generated at the same time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const loginRet3 = await authenticationService.login({
        email: createUserData.email,
        password: createUserData.password,
      });

      testAuthenticationResponse(jwtService, loginRet1, expectedUserData[1]);
      testAuthenticationResponse(jwtService, loginRet2, expectedUserData[2]);
      testAuthenticationResponse(jwtService, loginRet3, expectedUserData[2]);

      testDistinctTokens(loginRet1.data.payload, loginRet2.data.payload);
      testDistinctTokens(loginRet1.data.payload, loginRet3.data.payload);
      testDistinctTokens(loginRet2.data.payload, loginRet3.data.payload);
    });

    it.each([{ loginData: null }, { loginData: undefined }])(
      'should fail when login data is $loginData',
      async ({ loginData }) => {
        const fn = () => authenticationService.login(loginData);
        await expect(fn()).rejects.toThrow(CredentialsMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(BadRequestException);
      },
    );

    it('should fail when user is inactive', async () => {
      const registerData = TestUserData.registerData;
      await authenticationService.register(registerData[0]);
      await userRepo.update(1, { active: false });

      const fn = () =>
        authenticationService.login({
          email: registerData[1].email,
          password: registerData[1].password,
        });
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when user is soft-deleted', async () => {
      const registerData = TestUserData.registerData;
      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);
      await userRepo.softDelete(2);
      const fn = () =>
        authenticationService.login({
          email: registerData[1].email,
          password: registerData[1].password,
        });
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    describe('email', () => {
      it.each([
        { emailDescription: null, email: null },
        { emailDescription: undefined, email: undefined },
        { emailDescription: 'empty', email: '' },
      ])('should fail when email is $emailDescription', async ({ email }) => {
        const fn = () =>
          authenticationService.login({ email, password: '123' });
        await expect(fn()).rejects.toThrow(EmailMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when email is not found', async () => {
        const registerData = TestUserData.registerData;
        await authenticationService.register(registerData[0]);
        await authenticationService.register(registerData[1]);
        const fn = () =>
          authenticationService.login({
            email: 'inexistentuser@email.com',
            password: '123',
          });
        await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
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
          const registerData = TestUserData.registerData;
          const fn = () =>
            authenticationService.login({
              email: registerData[1].email,
              password,
            });
          await expect(fn()).rejects.toThrow(PasswordMessage.REQUIRED);
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });

    it('should fail when password is wrong', async () => {
      const registerData = TestUserData.registerData;
      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);
      const fn = () =>
        authenticationService.login({
          email: registerData[1].email,
          password: 'wrong_password',
        });
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh login', async () => {
      const registerData = TestUserData.registerData;
      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];

      const refreshResponses = [
        await authenticationService.refresh(
          registerResponses[0].data.payload.refreshToken,
        ),
        await authenticationService.refresh(
          registerResponses[1].data.payload.refreshToken,
        ),
        await authenticationService.refresh(
          registerResponses[1].data.payload.refreshToken,
        ),
      ];

      const decodedAccessTokens = [
        await jwtService.decode(refreshResponses[0].data.payload.token),
        await jwtService.decode(refreshResponses[1].data.payload.token),
        await jwtService.decode(refreshResponses[2].data.payload.token),
      ];

      testDecodedAccessToken(decodedAccessTokens[0], 1);
      testDecodedAccessToken(decodedAccessTokens[1], 2);
      testDecodedAccessToken(decodedAccessTokens[2], 2);
    });

    it.each([
      { refreshTokenDescription: null, refreshToken: null },
      { refreshTokenDescription: undefined, refreshToken: undefined },
      { refreshTokenDescription: 'empty', refreshToken: '' },
    ])(
      'should fail when refresh token is $refreshTokenDescription',
      async ({ refreshToken }) => {
        const registerData = TestUserData.registerData;
        await authenticationService.register(registerData[0]);
        const fn = async () =>
          await authenticationService.refresh(refreshToken);
        await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
        await expect(fn()).rejects.toThrow(UnauthorizedException);
      },
    );

    it('should fail when refresh token is invalid', async () => {
      const registerData = TestUserData.registerData;
      await authenticationService.register(registerData[0]);
      const fn = async () =>
        await authenticationService.refresh('invalid_refresh_token');
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is blacklisted', async () => {
      const registerData = TestUserData.registerData;
      const registered = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
      ];

      await tokenService.revokeRefreshToken(
        registered[1].data.payload.refreshToken,
      );

      const refreshed = await authenticationService.refresh(
        registered[0].data.payload.refreshToken,
      );

      expect(refreshed).toBeDefined();

      const fn = async (refreshToken) =>
        await authenticationService.refresh(refreshToken);
      await expect(fn(registered[1].data.payload.refreshToken)).rejects.toThrow(
        AuthorizationMessage.NOT_AUTORIZED,
      );
      await expect(fn(registered[1].data.payload.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should fail when user is inactive', async () => {
      const registerData = TestUserData.registerData;
      const registered = await authenticationService.register(registerData[0]);
      await userRepo.update(1, { active: false });
      const fn = () =>
        authenticationService.refresh(registered.data.payload.refreshToken);
      expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is user is soft-deleted', async () => {
      const registerData = TestUserData.registerData;
      const registered = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
      ];
      await userRepo.softDelete(2);
      const fn = () =>
        authenticationService.refresh(registered[1].data.payload.refreshToken);
      expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      expect(fn()).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout', async () => {
      const registerData = TestUserData.registerData;
      const registered = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];

      const logoutsResults = [
        await authenticationService.logout(
          registered[1].data.payload.refreshToken,
        ),
      ];

      const refreshTokens = await refreshTokenRepo.find();

      expect(logoutsResults[0]).toEqual({ status: 'success' });
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
        const registerData = TestUserData.registerData;
        await authenticationService.register(registerData[0]);
        const fn = async () => authenticationService.logout(refreshToken);
        await expect(fn).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
        await expect(fn).rejects.toThrow(UnauthorizedException);
      },
    );

    it('should fail when user is inactive', async () => {
      const registerData = TestUserData.registerData;
      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      await userRepo.update(2, { active: false });

      const fn = async () =>
        authenticationService.logout(
          registerResponses[1].data.payload.refreshToken,
        );
      await expect(fn).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is blacklisted', async () => {
      const registerData = TestUserData.registerData;
      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];

      await tokenService.revokeRefreshToken(
        registerResponses[1].data.payload.refreshToken,
      );

      const fn = async () =>
        authenticationService.logout(
          registerResponses[1].data.payload.refreshToken,
        );
      await expect(fn).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is user is soft-deleted', async () => {
      const registerData = TestUserData.registerData;
      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      await userRepo.softDelete(2);
      const fn = async () =>
        authenticationService.logout(
          registerResponses[1].data.payload.refreshToken,
        );
      expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      expect(fn()).rejects.toThrow(UnauthorizedException);
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
      const responsePayload = await authenticationService[
        'buildResponsePayload'
      ](user, token, refreshToken);
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
            await authenticationService['buildResponsePayload'](
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
          await authenticationService['buildResponsePayload'](
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
            await authenticationService['buildResponsePayload'](
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
          const responsePayload = await authenticationService[
            'buildResponsePayload'
          ](user, token, refreshToken);
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
