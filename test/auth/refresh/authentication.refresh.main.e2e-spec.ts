import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { RefreshTokenMessage } from '../../../src/modules/authentication/messages/refresh-token/refresh-token.messages.enum';
import { RefreshTokenRepository } from '../../../src/modules/authentication/repositories/refresh-token.repository';
import { testDecodedAccessToken } from '../../../src/modules/authentication/services/authentication/authentication-test-utils';
import { AuthenticationService } from '../../../src/modules/authentication/services/authentication/authentication.service';
import { TokenService } from '../../../src/modules/authentication/services/token/token.service';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { AuthorizationMessage } from '../../../src/modules/system/messages/authorization/authorization.messages.enum';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { UserService } from '../../../src/modules/user/services/user/user.service';

describe('AuthenticationController (e2e) - /authentication/refresh (POST)', () => {
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

  it('should refresh', async () => {
    const [userId1, userId2, userId3] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
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
    const response1 = await request(app.getHttpServer())
      .post('/authentication/login')
      .send({
        email: 'user1@email.com',
        password: 'Abc12*',
      });
    expect(response1.statusCode).toEqual(HttpStatus.CREATED);

    const response2 = await request(app.getHttpServer())
      .post('/authentication/login')
      .send({
        email: 'user2@email.com',
        password: 'Xyz12*',
      });
    expect(response2.statusCode).toEqual(HttpStatus.CREATED);

    const response3 = await request(app.getHttpServer())
      .post('/authentication/login')
      .send({
        email: 'user2@email.com',
        password: 'Xyz12*',
      });
    expect(response3.statusCode).toEqual(HttpStatus.CREATED);

    const refreshResponses = [response1.body, response2.body, response3.body];

    const decodedAccessTokens = [
      await jwtService.decode(refreshResponses[0].data.payload.token),
      await jwtService.decode(refreshResponses[1].data.payload.token),
      await jwtService.decode(refreshResponses[2].data.payload.token),
    ];

    const users = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_EMAIL)
      .getMany();

    testDecodedAccessToken(decodedAccessTokens[0], users[0].id);
    testDecodedAccessToken(decodedAccessTokens[1], users[1].id);
    testDecodedAccessToken(decodedAccessTokens[2], users[1].id);
  });

  it('should reject to refresh token when refreshToken is null', async () => {
    await authenticationService.register({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      acceptTerms: true,
    });

    const response = await request(app.getHttpServer())
      .post('/authentication/refresh')
      .send({ refreshToken: null });
    expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.body).toEqual({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: { refreshToken: RefreshTokenMessage.REQUIRED },
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
    });
  });

  it('should reject to refresh token when refreshToken is undefined', async () => {
    await authenticationService.register({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      acceptTerms: true,
    });

    const response = await request(app.getHttpServer())
      .post('/authentication/refresh')
      .send({ refreshToken: undefined });
    expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.body).toEqual({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: { refreshToken: RefreshTokenMessage.REQUIRED },
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
    });
  });

  it('should reject to refresh token when refreshToken is empty string', async () => {
    await authenticationService.register({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      acceptTerms: true,
    });

    const response = await request(app.getHttpServer())
      .post('/authentication/refresh')
      .send({ refreshToken: '' });
    expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.body).toEqual({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: { refreshToken: RefreshTokenMessage.REQUIRED },
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
    });
  });

  it("should reject to refresh token when refreshToken's user is inactive", async () => {
    const registerResponses = [
      await authenticationService.register({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        acceptTerms: true,
      }),
      await authenticationService.register({
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        acceptTerms: true,
      }),
      await authenticationService.register({
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Cba12*',
        acceptTerms: true,
      }),
    ];
    const user = await userRepo
      .createQueryBuilder()
      .update(User)
      .set({ active: false })
      .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user2@email.com' })
      .execute();

    const response = await request(app.getHttpServer())
      .post('/authentication/refresh')
      .send({ refreshToken: registerResponses[1].data.payload.refreshToken });
    expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
    expect(response.body).toEqual({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: ExceptionText.UNAUTHORIZED,
      message: AuthorizationMessage.NOT_AUTORIZED,
    });
  });

  it('should reject to refresh token when refreshToken is blacklisted', async () => {
    const registerData = [
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        acceptTerms: true,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        acceptTerms: true,
      },
      {
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Cba12*',
        acceptTerms: true,
      },
    ];
    const registerResponses = [
      await authenticationService.register(registerData[0]),
      await authenticationService.register(registerData[1]),
      await authenticationService.register(registerData[2]),
    ];
    await tokenService.revokeRefreshToken(
      registerResponses[1].data.payload.refreshToken,
    );
    const response = await request(app.getHttpServer())
      .post('/authentication/refresh')
      .send({
        refreshToken: registerResponses[1].data.payload.refreshToken,
      });
    expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
    expect(response.body).toEqual({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: ExceptionText.UNAUTHORIZED,
      message: AuthorizationMessage.NOT_AUTORIZED,
    });
  });

  it("should reject to refresh token when refreshToken's user is soft-deleted", async () => {
    const registerData = [
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        acceptTerms: true,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        acceptTerms: true,
      },
      {
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Cba12*',
        acceptTerms: true,
      },
    ];
    const registerResponses = [
      await authenticationService.register(registerData[0]),
      await authenticationService.register(registerData[1]),
      await authenticationService.register(registerData[2]),
    ];
    await userRepo
      .createQueryBuilder(UserConstants.USERS)
      .softDelete()
      .from(User)
      .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user2@email.com' })
      .execute();
    const response = await request(app.getHttpServer())
      .post('/authentication/refresh')
      .send({ refreshToken: registerResponses[1].data.payload.refreshToken });
    expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
    expect(response.body).toEqual({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: ExceptionText.UNAUTHORIZED,
      message: AuthorizationMessage.NOT_AUTORIZED,
    });
  });
});
