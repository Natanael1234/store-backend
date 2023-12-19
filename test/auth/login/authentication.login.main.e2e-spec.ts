import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { RefreshTokenRepository } from '../../../src/modules/authentication/repositories/refresh-token.repository';
import {
  testAuthenticationResponse,
  testDistinctTokens,
} from '../../../src/modules/authentication/services/authentication/authentication-test-utils';
import { AuthenticationService } from '../../../src/modules/authentication/services/authentication/authentication.service';
import { TokenService } from '../../../src/modules/authentication/services/token/token.service';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { AuthorizationMessage } from '../../../src/modules/system/messages/authorization/authorization.messages.enum';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../src/modules/system/messages/text/text.messages';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { UserService } from '../../../src/modules/user/services/user/user.service';

const EmailMessage = new TextMessage('email', {
  maxLength: UserConfigs.EMAIL_MAX_LENGTH,
});

const PasswordMessage2 = new TextMessage('password', {
  maxLength: UserConfigs.PASSWORD_MAX_LENGTH,
});

describe('AuthenticationController (e2e) - /authentication/login (POST)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let jwtService: JwtService;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<User>;
  let tokenService: TokenService;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
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
    await module.close();
  });

  async function insertUsers(
    ...users: {
      name: string;
      email: string;
      password: string;
      active?: boolean;
      roles: Role[];
      softDeleted?: boolean;
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
          deletedAt: user.softDeleted ? new Date() : null,
        })
        .execute();
      ids.push(ret.identifiers[0].id);
    }
    return ids;
  }

  it('should login', async () => {
    await authenticationService.register({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Ab*123',
      acceptTerms: true,
    });
    await authenticationService.register({
      name: 'User 2',
      email: 'user2@email.com',
      password: 'Ab*234',
      acceptTerms: true,
    });
    await userService.create({
      name: 'User 3',
      email: 'user3@email.com',
      password: 'Ab*345',
      roles: [Role.ADMIN],
      active: true,
    });
    await authenticationService.register({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Ab*456',
      acceptTerms: true,
    });

    const [userId1, userId2, userId3, userId4] = (
      await userRepo
        .createQueryBuilder(UserConstants.USER)
        .select(UserConstants.USER_ID)
        .orderBy(UserConstants.USER_EMAIL, SortConstants.ASC)
        .getMany()
    ).map((user) => user.id);

    const expectedUserData = [
      {
        id: userId1,
        name: 'User 1',
        email: 'user1@email.com',
        active: true,
      },
      {
        id: userId2,
        name: 'User 2',
        email: 'user2@email.com',
        active: true,
      },
      {
        id: userId3,
        name: 'User 3',
        email: 'user3@email.com',
        active: true,
      },
      {
        id: userId4,
        name: 'User 4',
        email: 'user4@email.com',
        active: true,
      },
    ];

    const response1 = await request(app.getHttpServer())
      .post('/authentication/login')
      .send({ email: 'user1@email.com', password: 'Ab*123' });
    expect(response1.statusCode).toEqual(HttpStatus.CREATED);

    const response2 = await request(app.getHttpServer())
      .post('/authentication/login')
      .send({ email: 'user3@email.com', password: 'Ab*345' });
    expect(response2.statusCode).toEqual(HttpStatus.CREATED);

    // prevents tokens for the same user to be equal due to be generated at the same time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response3 = await request(app.getHttpServer())
      .post('/authentication/login')
      .send({ email: 'user3@email.com', password: 'Ab*345' });
    expect(response3.statusCode).toEqual(HttpStatus.CREATED);

    testAuthenticationResponse(jwtService, response1.body, expectedUserData[0]);
    testAuthenticationResponse(jwtService, response2.body, expectedUserData[2]);
    testAuthenticationResponse(jwtService, response3.body, expectedUserData[2]);

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
  });

  describe('email', () => {
    it('should accept valid email', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();

      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({ email: 'user1@email.com', password: 'Abc12*' });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should accept when email has max length', async () => {
      const email = 'x'.repeat(UserConfigs.EMAIL_MAX_LENGTH - 5) + '@e.co';
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email,
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();

      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({ email, password: 'Abc12*' });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should reject when email is longer than allowed', async () => {
      const email = 'x'.repeat(UserConfigs.EMAIL_MAX_LENGTH - 5 + 1) + '@e.co';
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email,
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email,
          password: 'Abc12*',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.MAX_LEN },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject invalid email', async () => {
      const email = 'invalid.com';
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email,
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email,
          password: 'Abc12*',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is null', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: null,
          password: 'Abc*12',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.NULL },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is undefined', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: undefined,
          password: 'Abc*12',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is number', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 1,
          password: 'Abc*12',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is boolean', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: true,
          password: 'Abc*12',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is array', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: [],
          password: 'Abc*12',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when email is object', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: {},
          password: 'Abc*12',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { email: EmailMessage.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject if email not found', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({ email: 'user2@email.com', password: 'Abc*12' });
      expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AuthorizationMessage.NOT_AUTORIZED,
        error: ExceptionText.UNAUTHORIZED,
      });
    });
  });

  describe('password', () => {
    it('should accept valid password', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password: 'Abc12*',
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should accept when password has max length', async () => {
      const password = 'Ab*1' + 'x'.repeat(UserConfigs.PASSWORD_MAX_LENGTH - 4);
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt(password),
            active: true,
          },
        ])
        .execute();

      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      // TODO: test body
    });

    it('should accept password without uppercase character', async () => {
      const password = 'abc12*';
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt(password),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
    });

    it('should accept password without lowercase character', async () => {
      const password = 'ABC12*';
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt(password),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
    });

    it('should accept password without digit character', async () => {
      const password = 'Abcde*';
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt(password),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
    });

    it('should accept password without special character', async () => {
      const password = 'Abcde1';
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt(password),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password,
        });
      expect(response.statusCode).toEqual(HttpStatus.CREATED);
    });

    it('should reject when password is null', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password: null,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.NULL },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is undefined', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password: undefined,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.REQUIRED },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is too long', async () => {
      const password =
        'Abc*' + 'x'.repeat(UserConfigs.PASSWORD_MAX_LENGTH - 4 + 1);
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt(password),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.MAX_LEN },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is number', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password: 1,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is boolean', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password: true,
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is array', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password: [],
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is object', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password: {},
        });
      expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: { password: PasswordMessage2.INVALID },
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      });
    });

    it('should reject when password is incorrect', async () => {
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            name: 'User 1',
            email: 'user1@email.com',
            roles: [Role.ROOT],
            hash: await encryptionService.encrypt('Abc12*'),
            active: true,
          },
        ])
        .execute();
      const response = await request(app.getHttpServer())
        .post('/authentication/login')
        .send({
          email: 'user1@email.com',
          password: 'Abc13*',
        });
      expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AuthorizationMessage.NOT_AUTORIZED,
        error: ExceptionText.UNAUTHORIZED,
      });
    });
  });

  it('should reject when user is inactive', async () => {
    const [userId1, userId2, userId3] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: false,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: true,
      },
      {
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Cba12*',
        roles: [Role.ADMIN],
      },
    );
    const response = await request(app.getHttpServer())
      .post('/authentication/login')
      .send({ email: 'user1@email.com', password: 'Abc12*' });
    expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
    expect(response.body).toEqual({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: AuthorizationMessage.NOT_AUTORIZED,
      error: ExceptionText.UNAUTHORIZED,
    });
  });

  it('should reject when user is soft-deleted', async () => {
    const [userId1, userId2, userId3] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
        softDeleted: true,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: true,
      },
      {
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Cba12*',
        roles: [Role.ADMIN],
      },
    );

    const response = await request(app.getHttpServer())
      .post('/authentication/login')
      .send({
        email: 'user1@email.com',
        password: 'Abc12*',
      });
  });
});
