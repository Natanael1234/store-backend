import {
  HttpStatus,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';
import { AcceptTermsMessage } from '../src/modules/authentication/enums/accept-terms-messages.ts/accept-terms-messages.enum';
import { Role } from '../src/modules/authentication/enums/role/role.enum';
import { RefreshTokenRepository } from '../src/modules/authentication/repositories/refresh-token.repository';
import {
  testAuthenticationResponse,
  testDecodedAccessToken,
  testDistinctTokens,
} from '../src/modules/authentication/services/authentication/authentication-test-utils';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { TokenService } from '../src/modules/authentication/services/token/token.service';
import { AuthorizationMessage } from '../src/modules/system/enums/messages/authorization-messages/authorization-messages.enum';
import { EmailMessage } from '../src/modules/system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../src/modules/system/enums/messages/name-messages/name-messages.enum';
import { PasswordMessage } from '../src/modules/system/enums/messages/password-messages/password-messages.enum';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { UserService } from '../src/modules/user/services/user/user.service';
import { TestUserData } from '../src/test/user/test-user-data';
import { testValidateUser } from '../src/test/user/test-user-utils';

describe('AuthenticationController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let jwtService: JwtService;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<UserEntity>;
  let tokenService: TokenService;

  async function httpPost(endpoint: string, body: any, expectedStatus: number) {
    const test = await request(app.getHttpServer()).post(endpoint).send(body);
    expect(test.statusCode).toEqual(expectedStatus);
    return test.body;
  }

  async function httpPostError(
    endpoint: string,
    body: any,
    expectedErrorBody: {
      statusCode?: number;
      error?: string;
      message?: any;
    },
  ) {
    const test = await request(app.getHttpServer()).post(endpoint).send(body);
    expect(test.statusCode).toEqual(expectedErrorBody.statusCode);
    expect(test.body).toEqual(expectedErrorBody);
    return test.body;
  }

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    userService = app.get<UserService>(UserService);
    authenticationService = app.get<AuthenticationService>(
      AuthenticationService,
    );
    jwtService = app.get<JwtService>(JwtService);
    tokenService = app.get<TokenService>(TokenService);
    refreshTokenRepo = app.get<RefreshTokenRepository>(RefreshTokenRepository);
    userRepo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));

    // app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );

    await app.init();
    // TODO: https://github.com/nestjs/nest/issues/5264
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  describe('/authentication/register (POST)', () => {
    it('should register users', async () => {
      // httpPost('/authentication/register', data, 201)
      const registerData = TestUserData.registerData;
      const response1 = await httpPost(
        '/authentication/register',
        registerData[0],
        201,
      );
      const response2 = await httpPost(
        '/authentication/register',
        registerData[1],
        201,
      );
      const createData = {
        name: 'Another user',
        email: 'anotheruser@email.com',
        password: 'A123df*',
        roles: [Role.ADMIN],
        active: false,
      };
      await userService.create(createData);
      const response3 = await httpPost(
        '/authentication/register',
        registerData[2],
        201,
      );

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

    it('should fail when have multiple errors', async () => {
      const registerData = TestUserData.registerData;
      await httpPostError(
        '/authentication/register',
        {
          ...registerData[0],
          name: null,
          email: null,
        },
        {
          statusCode: 422,
          message: {
            name: NameMessage.REQUIRED,
            email: EmailMessage.REQUIRED,
          },
          error: 'UnprocessableEntityException',
        },
      );
    });

    describe('name', () => {
      it.each([
        {
          description: 'number',
          name: 3342,
          message: { name: NameMessage.STRING },
        },
        {
          description: 'boolean',
          name: true,
          message: { name: NameMessage.STRING },
        },
        {
          description: 'array',
          name: [],
          message: { name: NameMessage.STRING },
        },
        {
          description: 'object',
          name: {},
          message: { name: NameMessage.STRING },
        },
        {
          description: null,
          name: null,
          message: { name: NameMessage.REQUIRED },
        },
        {
          description: undefined,
          name: undefined,
          message: { name: NameMessage.REQUIRED },
        },
        {
          description: 'empty',
          name: '',
          message: { name: NameMessage.REQUIRED },
        },
        {
          description: 'too short',
          name: 'a',
          message: {
            name: NameMessage.MIN_LEN,
          },
        },
        {
          description: 'too long',
          name: 'x'.repeat(61),
          message: {
            name: NameMessage.MAX_LEN,
          },
        },
      ])('should fail when name is $description', async ({ name, message }) => {
        const registerData = TestUserData.registerData;
        const data = { ...registerData[0], name };
        const expectedData = {
          statusCode: 422,
          message,
          error: 'UnprocessableEntityException',
        };
        await httpPostError('/authentication/register', data, expectedData);
      });
    });

    describe('email', () => {
      it.each([
        {
          description: 'number',
          email: 3342,
          message: { email: EmailMessage.STRING },
        },
        {
          description: 'boolean',
          email: true,
          message: { email: EmailMessage.STRING },
        },
        {
          description: 'array',
          email: [],
          message: { email: EmailMessage.STRING },
        },
        {
          description: 'object',
          email: {},
          message: { email: EmailMessage.STRING },
        },
        {
          description: null,
          email: null,
          message: { email: EmailMessage.REQUIRED },
        },
        {
          description: undefined,
          email: undefined,
          message: { email: EmailMessage.REQUIRED },
        },
        {
          description: 'empty',
          email: '',
          message: { email: EmailMessage.REQUIRED },
        },
        {
          description: 'too short',
          email: 'email.com',
          message: { email: EmailMessage.INVALID },
        },
        {
          description: 'too long',
          email: 'x'.repeat(51) + '@email.com',
          message: {
            email: EmailMessage.MAX_LEN,
          },
        },
      ])(
        'should fail when email is $description',
        async ({ email, message }) => {
          const registerData = TestUserData.registerData;
          const data = { ...registerData[0], email };
          const expectedData = {
            statusCode: 422,
            message,
            error: 'UnprocessableEntityException',
          };
          await httpPostError('/authentication/register', data, expectedData);
        },
      );

      it('should fail if email is already registered', async () => {
        const usersData = TestUserData.dataForRepository();
        await userService.create(usersData[0]);
        await userService.create(usersData[1]);
        await userService.create(usersData[2]);
        await httpPostError(
          '/authentication/register',
          {
            name: 'User x',
            email: usersData[0].email,
            password: 'Abd12*',
            acceptTerms: true,
          },
          {
            statusCode: 409,
            message: EmailMessage.INVALID,
            error: 'Conflict',
          },
        );
      });
    });

    describe('password', () => {
      it.each([
        {
          description: 'number',
          password: 3342,
          message: { password: PasswordMessage.STRING },
        },
        {
          description: 'boolean',
          password: true,
          message: { password: PasswordMessage.STRING },
        },
        {
          description: 'array',
          password: [],
          message: { password: PasswordMessage.STRING },
        },
        {
          description: 'object',
          password: {},
          message: { password: PasswordMessage.STRING },
        },
        {
          description: null,
          password: null,
          message: { password: PasswordMessage.REQUIRED },
        },
        {
          description: undefined,
          password: undefined,
          message: { password: PasswordMessage.REQUIRED },
        },
        {
          description: 'empty',
          password: '',
          message: { password: PasswordMessage.REQUIRED },
        },
        {
          description: 'too short',
          password: 'Ac12*',
          message: { password: PasswordMessage.MIN_LEN },
        },
        {
          description: 'too long',
          password: 'Abc12********',
          message: {
            password: PasswordMessage.MAX_LEN,
          },
        },
        {
          description: 'without number character',
          password: 'Abc***',
          message: {
            password: PasswordMessage.INVALID,
          },
        },
        {
          description: 'without uppercase character',
          password: 'abc12*',
          message: {
            password: PasswordMessage.INVALID,
          },
        },
        {
          description: 'without lowercase character',
          password: 'ABC***',
          message: {
            password: PasswordMessage.INVALID,
          },
        },
        {
          description: 'without special characters',
          password: 'Abc123',
          message: {
            password: PasswordMessage.INVALID,
          },
        },
      ])(
        'should fail when password is $description',
        async ({ password, message }) => {
          const registerData = TestUserData.registerData;
          const data = { ...registerData[0], password };
          const expectedData = {
            statusCode: 422,
            message,
            error: 'UnprocessableEntityException',
          };
          await httpPostError('/authentication/register', data, expectedData);
        },
      );
    });

    describe('acceptTerms', () => {
      it.each([
        {
          description: 'number',
          acceptTerms: 3342,
        },
        {
          description: 'array',
          acceptTerms: [],
        },
        {
          description: 'object',
          acceptTerms: {},
        },
        {
          description: null,
          acceptTerms: null,
        },
        {
          description: undefined,
          acceptTerms: undefined,
        },
        {
          description: 'empty',
          acceptTerms: '',
        },
        {
          description: 'invalid',
          acceptTerms: 'invalid',
        },
        {
          description: 'false',
          acceptTerms: false,
        },
      ])(
        'should fail when acceptTerms is $description',
        async ({ acceptTerms }) => {
          const registerData = TestUserData.registerData;
          const data = { ...registerData[0], acceptTerms };
          const expectedData = {
            statusCode: 422,
            message: { acceptTerms: AcceptTermsMessage.REQUIRED },
            error: 'UnprocessableEntityException',
          };
          await httpPostError('/authentication/register', data, expectedData);
        },
      );
    });
  });

  describe('/authentication/login (POST)', () => {
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

      const loginRet1 = await httpPost(
        '/authentication/login',
        {
          email: registerData[1].email,
          password: registerData[1].password,
        },
        201,
      );
      const loginRet2 = await httpPost(
        '/authentication/login',
        {
          email: createUserData.email,
          password: createUserData.password,
        },
        201,
      );

      // prevents tokens for the same user to be equal due to be generated at the same time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const loginRet3 = await httpPost(
        '/authentication/login',
        {
          email: createUserData.email,
          password: createUserData.password,
        },
        201,
      );

      testAuthenticationResponse(jwtService, loginRet1, expectedUserData[1]);
      testAuthenticationResponse(jwtService, loginRet2, expectedUserData[2]);
      testAuthenticationResponse(jwtService, loginRet3, expectedUserData[2]);

      testDistinctTokens(loginRet1.data.payload, loginRet2.data.payload);
      testDistinctTokens(loginRet1.data.payload, loginRet3.data.payload);
      testDistinctTokens(loginRet2.data.payload, loginRet3.data.payload);
    });

    describe('email', () => {
      it.each([
        {
          description: 'number',
          email: 3342,
          message: { email: EmailMessage.STRING },
        },
        {
          description: 'boolean',
          email: true,
          message: { email: EmailMessage.STRING },
        },
        {
          description: 'array',
          email: [],
          message: { email: EmailMessage.STRING },
        },
        {
          description: 'object',
          email: {},
          message: { email: EmailMessage.STRING },
        },
        {
          description: null,
          email: null,
          message: { email: EmailMessage.REQUIRED },
        },
        {
          description: undefined,
          email: undefined,
          message: { email: EmailMessage.REQUIRED },
        },
        {
          description: 'empty',
          email: '',
          message: { email: EmailMessage.REQUIRED },
        },
        {
          description: 'invalid',
          email: '@email.com',
          message: { email: 'Invalid email' },
        },
      ])(
        'should fail when email is $description',
        async ({ email, message }) => {
          const registerData = TestUserData.registerData;

          const data = {
            email,
            password: registerData[0].password,
          };
          const expectedData = {
            statusCode: 422,
            message,
            error: 'UnprocessableEntityException',
          };
          await httpPostError('/authentication/login', data, expectedData);
        },
      );
    });

    describe('password', () => {
      it.each([
        {
          description: 'number',
          password: 3342,
          message: { password: PasswordMessage.STRING },
        },
        {
          description: 'boolean',
          password: true,
          message: { password: PasswordMessage.STRING },
        },
        {
          description: 'array',
          password: [],
          message: { password: PasswordMessage.STRING },
        },
        {
          description: 'object',
          password: {},
          message: { password: PasswordMessage.STRING },
        },
        {
          description: null,
          password: null,
          message: { password: PasswordMessage.REQUIRED },
        },
        {
          description: undefined,
          password: undefined,
          message: { password: PasswordMessage.REQUIRED },
        },
        {
          description: 'empty',
          password: '',
          message: { password: PasswordMessage.REQUIRED },
        },
        {
          description: 'too short',
          password: 'Ac12*',
          message: { password: PasswordMessage.MIN_LEN },
        },
        {
          description: 'too long',
          password: 'Abc12********',
          message: {
            password: PasswordMessage.MAX_LEN,
          },
        },
        {
          description: 'without number character',
          password: 'Abc***',
          message: {
            password: PasswordMessage.INVALID,
          },
        },
        {
          description: 'without uppercase character',
          password: 'abc12*',
          message: {
            password: PasswordMessage.INVALID,
          },
        },
        {
          description: 'without lowercase character',
          password: 'ABC***',
          message: {
            password: PasswordMessage.INVALID,
          },
        },
        {
          description: 'without special characters',
          password: 'Abc123',
          message: {
            password: PasswordMessage.INVALID,
          },
        },
      ])(
        'should fail when password is $description',
        async ({ password, message }) => {
          const registerData = TestUserData.registerData;

          const data = { ...registerData[0], password };
          const expectedData = {
            statusCode: 422,
            message,
            error: 'UnprocessableEntityException',
          };
          await httpPostError('/authentication/register', data, expectedData);
        },
      );

      it('should fail if password is incorrect', async () => {
        const usersData = TestUserData.dataForRepository();

        await userService.create(usersData[0]);
        await userService.create(usersData[1]);
        await userService.create(usersData[2]);
        await httpPostError(
          '/authentication/login',
          {
            name: 'User',
            email: usersData[0].email,
            password: 'incorrect_password',
            acceptTerms: true,
          },
          {
            statusCode: 401,
            message: AuthorizationMessage.NOT_AUTORIZED,
            error: 'Unauthorized',
          },
        );
      });
    });

    it('should fail when user is inactive', async () => {
      const usersData = TestUserData.dataForRepository();
      const registerData = TestUserData.registerData;

      await authenticationService.register(registerData[0]);
      await userRepo.update(1, { active: false });

      await httpPostError(
        '/authentication/login',
        {
          email: usersData[0].email,
          password: usersData[0].password,
        },
        {
          statusCode: 401,
          message: AuthorizationMessage.NOT_AUTORIZED,
          error: 'Unauthorized',
        },
      );
    });

    it('should fail when user is soft-deleted', async () => {
      const usersData = TestUserData.dataForRepository();
      const registerData = TestUserData.registerData;

      await authenticationService.register(registerData[0]);
      await userRepo.update(1, { active: false });

      await httpPostError(
        '/authentication/login',
        {
          email: usersData[0].email,
          password: usersData[0].password,
        },
        {
          statusCode: 401,
          message: AuthorizationMessage.NOT_AUTORIZED,
          error: 'Unauthorized',
        },
      );
    });
  });

  describe('/authentication/refresh (POST)', () => {
    it('should refresh', async () => {
      const registerData = TestUserData.registerData;
      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];

      const refreshResponses = [
        await httpPost(
          '/authentication/refresh',
          { refreshToken: registerResponses[0].data.payload.refreshToken },
          201,
        ),
        await httpPost(
          '/authentication/refresh',
          { refreshToken: registerResponses[1].data.payload.refreshToken },
          201,
        ),
        await httpPost(
          '/authentication/refresh',
          { refreshToken: registerResponses[1].data.payload.refreshToken },
          201,
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

    it('should fail when user is inactive', async () => {
      const registerData = TestUserData.registerData;

      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      await userRepo.update(2, { active: false });

      await httpPostError(
        '/authentication/refresh',
        {
          refreshToken: registerResponses[1].data.payload.refreshToken,
        },
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: AuthorizationMessage.NOT_AUTORIZED,
        },
      );
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

      await httpPostError(
        '/authentication/refresh',
        {
          refreshToken: registerResponses[1].data.payload.refreshToken,
        },
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: AuthorizationMessage.NOT_AUTORIZED,
        },
      );
    });

    it('should fail when refresh token is user is soft-deleted', async () => {
      const registerData = TestUserData.registerData;

      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      await userRepo.softDelete(2);

      await httpPostError(
        '/authentication/refresh',
        {
          refreshToken: registerResponses[1].data.payload.refreshToken,
        },
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: AuthorizationMessage.NOT_AUTORIZED,
        },
      );
    });
  });

  describe('/authentication/logout (POST)', () => {
    it('should logout', async () => {
      const registerData = TestUserData.registerData;
      const registered = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];

      const logoutsResults = [
        await httpPost(
          '/authentication/logout',
          { refreshToken: registered[1].data.payload.refreshToken },
          201,
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

      await httpPostError(
        '/authentication/logout',
        {
          refreshToken: registerResponses[1].data.payload.refreshToken,
        },
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: AuthorizationMessage.NOT_AUTORIZED,
        },
      );
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

      await httpPostError(
        '/authentication/logout',
        {
          refreshToken: registerResponses[1].data.payload.refreshToken,
        },
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: AuthorizationMessage.NOT_AUTORIZED,
        },
      );
    });

    it('should fail when refresh token is user is soft-deleted', async () => {
      const registerData = TestUserData.registerData;

      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      await userRepo.softDelete(2);

      await httpPostError(
        '/authentication/logout',
        {
          refreshToken: registerResponses[1].data.payload.refreshToken,
        },
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: AuthorizationMessage.NOT_AUTORIZED,
        },
      );
    });
  });
});
