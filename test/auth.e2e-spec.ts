import { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getTestingModule } from '../src/.jest/test-config.module';
import { UserService } from '../src/modules/user/services/user/user.service';
import { AuthService } from '../src/modules/auth/services/auth/auth.service';
import {
  testLogin,
  testLogout,
  testRefresh,
  testRegister,
} from '../src/modules/auth/services/auth/auth-test-utils';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenRepository } from '../src/modules/auth/repositories/refresh-token.repository';
import { Repository } from 'typeorm';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

const registerEndpoint = '/auth/register';
const loginEndpoint = '/auth/login';
const refreshEndpoint = '/auth/refresh';
const logoutEndpoint = '/auth/logout';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userService: UserService;
  let authService: AuthService;
  let jwtService: JwtService;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<UserEntity>;

  async function httpPost(endpoint: string, body: any, expectedStatus: number) {
    const test = await request(app.getHttpServer())
      .post(endpoint)
      .send(body)
      .expect(expectedStatus);
    return test.body;
  }

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    userService = app.get<UserService>(UserService);
    authService = app.get<AuthService>(AuthService);
    jwtService = app.get<JwtService>(JwtService);
    refreshTokenRepo = app.get<RefreshTokenRepository>(RefreshTokenRepository);
    userRepo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));

    await app.init();
    // TODO: https://github.com/nestjs/nest/issues/5264
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register users', async () => {
      await testRegister(
        userService,
        userRepo,
        refreshTokenRepo,
        jwtService,
        (data: any) => httpPost(registerEndpoint, data, 201),
      );
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login', async () => {
      await testLogin(userService, authService, jwtService, (data) =>
        httpPost(loginEndpoint, data, 201),
      );
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should login', async () => {
      await testRefresh(authService, jwtService, (refreshToken) =>
        httpPost(refreshEndpoint, { refreshToken }, 201),
      );
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout', async () => {
      await testLogout(authService, refreshTokenRepo, (refreshToken) =>
        httpPost(logoutEndpoint, { refreshToken }, 201),
      );
    });
  });
});
