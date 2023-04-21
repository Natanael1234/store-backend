import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';
import { AcceptTermsMessage } from '../src/modules/authentication/enums/accept-terms-messages.ts/accept-terms-messages.enum';
import { CredentialsMessage } from '../src/modules/authentication/enums/cretentials-messages.ts/credentials-messages.enum';
import { RefreshTokenRepository } from '../src/modules/authentication/repositories/refresh-token.repository';
import {
  testLogin,
  testLogout,
  testRefresh,
  testRegister,
} from '../src/modules/authentication/services/authentication/authentication-test-utils';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { EmailMessage } from '../src/modules/system/enums/email-messages/email-messages.enum';
import { NameMessage } from '../src/modules/system/enums/name-messages/name-messages.enum';
import { PasswordMessage } from '../src/modules/system/enums/password-messages/password-messages.enum';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { UserService } from '../src/modules/user/services/user/user.service';
import { TestUserData } from '../src/test/test-user-data';

const usersData = TestUserData.dataForRepository();
const registerData = TestUserData.registerData;

const registerEndpoint = '/authentication/register';
const loginEndpoint = '/authentication/login';
const refreshEndpoint = '/authentication/refresh';
const logoutEndpoint = '/authentication/logout';

describe('AuthenticationController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let jwtService: JwtService;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<UserEntity>;

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
      await testRegister(
        userService,
        userRepo,
        refreshTokenRepo,
        jwtService,
        (data: any) => httpPost(registerEndpoint, data, 201),
      );
    });

    it('should fail when have multiple errors', async () => {
      await httpPostError(
        registerEndpoint,
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
        const data = { ...registerData[0], name };
        const expectedData = {
          statusCode: 422,
          message,
          error: 'UnprocessableEntityException',
        };
        await httpPostError(registerEndpoint, data, expectedData);
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
          const data = { ...registerData[0], email };
          const expectedData = {
            statusCode: 422,
            message,
            error: 'UnprocessableEntityException',
          };
          await httpPostError(registerEndpoint, data, expectedData);
        },
      );

      it('should fail if email is already registered', async () => {
        await userService.create(usersData[0]);
        await userService.create(usersData[1]);
        await userService.create(usersData[2]);
        await httpPostError(
          registerEndpoint,
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
          const data = { ...registerData[0], password };
          const expectedData = {
            statusCode: 422,
            message,
            error: 'UnprocessableEntityException',
          };
          await httpPostError(registerEndpoint, data, expectedData);
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
          const data = { ...registerData[0], acceptTerms };
          const expectedData = {
            statusCode: 422,
            message: { acceptTerms: AcceptTermsMessage.REQUIRED },
            error: 'UnprocessableEntityException',
          };
          await httpPostError(registerEndpoint, data, expectedData);
        },
      );
    });
  });

  describe('/authentication/login (POST)', () => {
    it('should login', async () => {
      await testLogin(userService, authenticationService, jwtService, (data) =>
        httpPost(loginEndpoint, data, 201),
      );
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
          const data = {
            email,
            password: registerData[0].password,
          };
          const expectedData = {
            statusCode: 422,
            message,
            error: 'UnprocessableEntityException',
          };
          await httpPostError(loginEndpoint, data, expectedData);
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
          const data = { ...registerData[0], password };
          const expectedData = {
            statusCode: 422,
            message,
            error: 'UnprocessableEntityException',
          };
          await httpPostError(registerEndpoint, data, expectedData);
        },
      );

      it('should fail if password is incorrect', async () => {
        await userService.create(usersData[0]);
        await userService.create(usersData[1]);
        await userService.create(usersData[2]);
        await httpPostError(
          loginEndpoint,
          {
            name: 'User',
            email: usersData[0].email,
            password: 'incorrect_password',
            acceptTerms: true,
          },
          {
            statusCode: 401,
            message: CredentialsMessage.INVALID,
            error: 'Unauthorized',
          },
        );
      });
    });
  });

  describe('/authentication/refresh (POST)', () => {
    it('should refresh', async () => {
      await testRefresh(authenticationService, jwtService, (refreshToken) =>
        httpPost(refreshEndpoint, { refreshToken }, 201),
      );
    });
  });

  describe('/authentication/logout (POST)', () => {
    it('should logout', async () => {
      await testLogout(
        authenticationService,
        refreshTokenRepo,
        (refreshToken) => httpPost(logoutEndpoint, { refreshToken }, 201),
      );
    });
  });
});
