import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';
import { RefreshTokenRepository } from '../src/modules/auth/repositories/refresh-token.repository';
import { registerData } from '../src/modules/auth/services/auth/auth-test-utils';
import { AuthService } from '../src/modules/auth/services/auth/auth.service';
import { ValidationPipe } from '../src/modules/pipes/custom-validation.pipe';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { UserService } from '../src/modules/user/services/user/user.service';
import {
  testValidateUser,
  usersData,
} from '../src/modules/user/test-user-utils';

const usersEndpoint = '/users';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userService: UserService;
  let authService: AuthService;
  let jwtService: JwtService;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<UserEntity>;

  async function httpGet(
    endpoint: string,
    params: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let test = request(app.getHttpServer()).get(endpoint);
    if (accessToken) {
      test = test.set('Authorization', 'bearer ' + accessToken);
    }
    const result = await test.query(params || {});
    expect(result.statusCode).toEqual(expectedStatus);
    return result.body;
  }

  async function httpPost(
    endpoint: string,
    body: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let test = request(app.getHttpServer()).post(endpoint);
    if (accessToken) {
      test = test.set('Authorization', 'bearer ' + accessToken);
    }
    const result = await test.send(body);
    expect(result.statusCode).toEqual(expectedStatus);
    return result.body;
  }

  async function httpPatch(
    endpoint: string,
    body: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let test = request(app.getHttpServer()).patch(endpoint);
    if (accessToken) {
      test = test.set('Authorization', 'bearer ' + accessToken);
    }
    const result = await test.send(body);
    expect(result.statusCode).toEqual(expectedStatus);
    return result.body;
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
    authService = app.get<AuthService>(AuthService);
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
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  // TODO: test autorization

  describe('/users (POST)', () => {
    it('should create users', async () => {
      const expectedData = [
        { id: 1, name: usersData[0].name, email: usersData[0].email },
        { id: 2, name: usersData[1].name, email: usersData[1].email },
        { id: 3, name: usersData[2].name, email: usersData[2].email },
      ];

      const registeredUser = await authService.register(registerData[0]);
      const createdUsers = [
        await httpPost(
          usersEndpoint,
          registerData[1],
          201,
          registeredUser.data.payload.token,
        ),
        await httpPost(
          usersEndpoint,
          registerData[2],
          201,
          registeredUser.data.payload.token,
        ),
      ];
      const users = await userRepo.find();

      expect(users).toHaveLength(3);
      testValidateUser(createdUsers[0], expectedData[1]);
      testValidateUser(createdUsers[1], expectedData[2]);
      testValidateUser(users[0], expectedData[0]);
      testValidateUser(users[1], expectedData[1]);
      testValidateUser(users[2], expectedData[2]);
    });

    it('should fail if not authenticated', async () => {});
  });

  describe('/users/:userId (PATCH)', () => {
    it('should update an user', async () => {
      let newName = 'New Name';
      let newEmail = 'newname@email.com';
      let updateData = { name: newName, email: newEmail };
      let expectedUpdateData = [
        {
          id: 1,
          name: usersData[0].name,
          email: usersData[0].email,
        },
        {
          id: 2,
          name: newName,
          email: newEmail,
        },
        {
          id: 3,
          name: usersData[2].name,
          email: usersData[2].email,
        },
      ];
      const registeredUsers = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
        await authService.register(registerData[2]),
      ];

      const retUpdate = await httpPatch(
        usersEndpoint + '/2',
        updateData,
        200,
        registeredUsers[1].data.payload.token,
      );
      const users = await userRepo.find();

      expect(users).toHaveLength(3);
      testValidateUser(retUpdate, expectedUpdateData[1]);
      testValidateUser(users[0], expectedUpdateData[0]);
      testValidateUser(users[1], expectedUpdateData[1]);
      testValidateUser(users[2], expectedUpdateData[2]);
    });
  });

  describe('/users (GET)', () => {
    it('should find users', async () => {
      const registeredUsers = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
        await authService.register(registerData[2]),
      ];
      const expectedData = [
        { id: 1, name: registerData[0].name, email: registerData[0].email },
        { id: 2, name: registerData[1].name, email: registerData[1].email },
        { id: 3, name: registerData[2].name, email: registerData[2].email },
      ];

      const users = await httpGet(
        usersEndpoint,
        {},
        200,
        registeredUsers[1].data.payload.token,
      );

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(3);
      testValidateUser(users[0], expectedData[0]);
      testValidateUser(users[1], expectedData[1]);
      testValidateUser(users[2], expectedData[2]);
    });
  });

  describe('/users/:userId (GET)', () => {
    it('should find one user', async () => {
      const registeredUsers = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
        await authService.register(registerData[2]),
      ];
      const expectedData = {
        id: 2,
        name: registerData[1].name,
        email: registerData[1].email,
      };

      const user = await httpGet(
        usersEndpoint + '/2',
        {},
        200,
        registeredUsers[1].data.payload.token,
      );

      testValidateUser(user, expectedData);
    });
  });
});
