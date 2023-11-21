import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { AcceptTermsMessage } from '../../../src/modules/authentication/messages/accept-terms/accept-terms.messages.enum';
import { RefreshTokenRepository } from '../../../src/modules/authentication/repositories/refresh-token.repository';
import {
  testAuthenticationResponse,
  testDistinctTokens,
} from '../../../src/modules/authentication/services/authentication/authentication-test-utils';
import { AuthenticationService } from '../../../src/modules/authentication/services/authentication/authentication.service';
import { TokenService } from '../../../src/modules/authentication/services/token/token.service';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { PasswordMessage } from '../../../src/modules/system/messages/password/password.messages.enum';
import { TextMessage } from '../../../src/modules/system/messages/text/text.messages';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { UserService } from '../../../src/modules/user/services/user/user.service';
import { testValidateUsersWithPassword } from '../../../src/test/user/test-user-utils';

const NameMessage = new TextMessage('name', {
  minLength: UserConfigs.NAME_MIN_LENGTH,
  maxLength: UserConfigs.NAME_MAX_LENGTH,
});
const EmailMessage = new TextMessage('email', {
  maxLength: UserConfigs.EMAIL_MAX_LENGTH,
});
const PasswordMessage2 = new TextMessage('password', {
  maxLength: UserConfigs.PASSWORD_MAX_LENGTH,
});

describe('AuthenticationController (e2e) - /authentication/register (POST)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let jwtService: JwtService;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<User>;
  let tokenService: TokenService;
  let encryptionService: EncryptionService;

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
    userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = app.get<EncryptionService>(EncryptionService);

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

  it('should register users', async () => {
    const response1 = await request(app.getHttpServer())
      .post('/authentication/register')
      .send({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Ab*123',
        acceptTerms: true,
      });
    expect(response1.statusCode).toEqual(HttpStatus.CREATED);
    const response2 = await request(app.getHttpServer())
      .post('/authentication/register')
      .send({
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Ab*234',
        acceptTerms: true,
      });
    expect(response2.statusCode).toEqual(HttpStatus.CREATED);
    await userService.create({
      name: 'User 3',
      email: 'user3@email.com',
      password: 'Ab*345',
      roles: [Role.ADMIN],
      active: false,
    });
    const response3 = await request(app.getHttpServer())
      .post('/authentication/register')
      .send({
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Ab*456',
        acceptTerms: true,
      });
    expect(response3.statusCode).toEqual(HttpStatus.CREATED);

    const [userId1, userId2, userId3, userId4] = (
      await userRepo
        .createQueryBuilder(UserConstants.USER)
        .select(UserConstants.USER_ID)
        .orderBy(UserConstants.USER_EMAIL, SortConstants.ASC)
        .getMany()
    ).map((user) => user.id);

    testAuthenticationResponse(jwtService, response1.body, {
      id: userId1,
      name: 'User 1',
      email: 'user1@email.com',
      active: true,
    });
    testAuthenticationResponse(jwtService, response2.body, {
      id: userId2,
      name: 'User 2',
      email: 'user2@email.com',
      active: true,
    });
    testAuthenticationResponse(jwtService, response3.body, {
      id: userId4,
      name: 'User 4',
      email: 'user4@email.com',
      active: true,
    });

    // check if payloads are different
    testDistinctTokens(
      response1.body.data.payload,
      response2.body.data.payload,
    );
    testDistinctTokens(
      response1.body.data.payload,
      response3.body.data.payload,
    );
    testDistinctTokens(
      response2.body.data.payload,
      response3.body.data.payload,
    );

    const repositoryRefreshTokens = await refreshTokenRepo.find();
    expect(repositoryRefreshTokens).toHaveLength(3);
    expect(repositoryRefreshTokens[0].userId).toEqual(userId1);
    expect(repositoryRefreshTokens[1].userId).toEqual(userId2);
    expect(repositoryRefreshTokens[2].userId).toEqual(userId4);

    const usersWithHash = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .getMany();

    expect(usersWithHash).toHaveLength(4);
    await testValidateUsersWithPassword(
      usersWithHash,
      [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Ab*123',
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Ab*234',
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Ab*345',
          roles: [Role.ADMIN],
          active: false,
        },
        {
          name: 'User 4',
          email: 'user4@email.com',
          password: 'Ab*456',
          roles: [Role.USER],
          active: true,
        },
      ],
      encryptionService,
    );
  });

  it('should reject when have multiple errors', async () => {
    const response = await request(app.getHttpServer())
      .post('/authentication/register')
      .send({
        name: undefined,
        email: undefined,
        password: undefined,
        acceptTerms: undefined,
      });

    expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.body).toEqual({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: {
        name: NameMessage.REQUIRED,
        email: EmailMessage.REQUIRED,
        password: PasswordMessage2.REQUIRED,
        acceptTerms: AcceptTermsMessage.REQUIRED,
      },
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
    });
    return response.body;
  });

  describe('name', () => {
    it('should accept when name has min length', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'x'.repeat(UserConfigs.NAME_MIN_LENGTH),
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should accept when name has max length', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'x'.repeat(UserConfigs.NAME_MAX_LENGTH),
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should reject when name is null', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: null,
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { name: NameMessage.NULL },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when name is undefined', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: undefined,
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { name: NameMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when name is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'x'.repeat(UserConfigs.NAME_MIN_LENGTH - 1),
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { name: NameMessage.MIN_LEN },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when name is too long', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'x'.repeat(UserConfigs.NAME_MAX_LENGTH + 1),
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { name: NameMessage.MAX_LEN },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when name is number', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 1,
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { name: NameMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when name is boolean', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: true,
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { name: NameMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when name is array', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: [],
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { name: NameMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when name is object', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: {},
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { name: NameMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });
  });

  describe('email', () => {
    it('should accept valid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'a@e.co',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should accept when email has max length', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'x'.repeat(UserConfigs.EMAIL_MAX_LENGTH - 5) + '@e.co',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should reject invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'invalid.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is null', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: null,
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.NULL },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is undefined', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: undefined,
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is too long', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'x'.repeat(UserConfigs.EMAIL_MAX_LENGTH - 5 + 1) + '@e.co',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.MAX_LEN },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is number', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 1,
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is boolean', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: true,
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is array', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: [],
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is object', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: {},
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject if email is already registered', async () => {
      await userService.create({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      });
      await userService.create({
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      });

      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user2@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.CONFLICT);
      expect(response.body).toEqual({
        statusCode: HttpStatus.CONFLICT,
        message: EmailMessage.INVALID,
        error: ExceptionText.CONFLICT,
      });
    });
  });

  describe('password', () => {
    it('should accept valid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should accept when password has max length', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Ab*1' + 'x'.repeat(UserConfigs.PASSWORD_MAX_LENGTH - 4),
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should reject password without uppercase character', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject password without lowercase character', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'ABC*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject password without digit character', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'ABCde*',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject password without special character', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc123',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is null', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: null,
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.NULL },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is undefined', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: undefined,
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is too long', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password:
            'Abc*' + 'x'.repeat(UserConfigs.PASSWORD_MAX_LENGTH - 4 + 1),
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.MAX_LEN },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is number', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 1,
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is boolean', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: true,
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is array', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: [],
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is object', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: {},
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });
  });

  describe('acceptTerms', () => {
    it('should accept when acceptTerms is true', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should reject when acceptTerms is false', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: false,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { acceptTerms: AcceptTermsMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when acceptTerms is null', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: null,
        });
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { acceptTerms: AcceptTermsMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when acceptTerms is undefined', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: undefined,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { acceptTerms: AcceptTermsMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when acceptTerms is number', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: 1,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { acceptTerms: AcceptTermsMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when acceptTerms is string', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: 'true',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { acceptTerms: AcceptTermsMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when acceptTerms is array', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: [],
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { acceptTerms: AcceptTermsMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when acceptTerms is object', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/register')
        .send({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc*12',
          acceptTerms: {},
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { acceptTerms: AcceptTermsMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });
  });
});
