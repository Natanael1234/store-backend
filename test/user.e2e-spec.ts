import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';
import { RefreshTokenRepository } from '../src/modules/auth/repositories/refresh-token.repository';

import { AuthService } from '../src/modules/auth/services/auth/auth.service';
import { ValidationPipe } from '../src/modules/pipes/custom-validation.pipe';
import { EmailMessage } from '../src/modules/user/enums/email-messages/email-messages.enum';
import { UserMessage } from '../src/modules/user/enums/user-messages.ts/user-messages.enum';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { UserService } from '../src/modules/user/services/user/user.service';
import { TestUserData } from '../src/test/test-user-data';
import { testValidateUser } from '../src/test/test-user-utils';

const usersData = TestUserData.usersData;
const createUserData = TestUserData.userCreationData;
const registerData = TestUserData.registerData;

const endpoint = '/users';

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

  describe('/users (POST)', () => {
    it('should create users', async () => {
      const expectedData = [
        { id: 1, name: usersData[0].name, email: usersData[0].email },
        { id: 2, name: usersData[1].name, email: usersData[1].email },
        { id: 3, name: usersData[2].name, email: usersData[2].email },
      ];
      const registeredUser = await authService.register(registerData[0]);
      const token = registeredUser.data.payload.token;

      const createdUsers = [
        await httpPost(endpoint, createUserData[1], HttpStatus.CREATED, token),
        await httpPost(endpoint, createUserData[2], HttpStatus.CREATED, token),
      ];
      const users = await userRepo.find();

      expect(users).toHaveLength(3);
      testValidateUser(createdUsers[0], expectedData[1]);
      testValidateUser(createdUsers[1], expectedData[2]);
      testValidateUser(users[0], expectedData[0]);
      testValidateUser(users[1], expectedData[1]);
      testValidateUser(users[2], expectedData[2]);
    });

    it('should fail if not authenticated', async () => {
      const body = await httpPost(
        endpoint,
        createUserData[1],
        HttpStatus.UNAUTHORIZED,
      );
      expect(body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    describe('email', () => {
      it('should fail if email is already in use', async () => {
        const registeredUsers = [
          await authService.register(registerData[0]),
          await authService.register(registerData[1]),
        ];
        const data = { ...registerData[2], email: registerData[1].email };
        const token = registeredUsers[0].data.payload.token;

        const body = await httpPost(endpoint, data, HttpStatus.CONFLICT, token);

        expect(body).toEqual({
          error: 'Conflict',
          message: EmailMessage.INVALID,
          statusCode: HttpStatus.CONFLICT,
        });
      });

      it.each(TestUserData.getEmailErrorDataList('create'))(
        'should fail if email is $description',
        async ({ data, statusCode, response }) => {
          const registeredUSer = await authService.register(registerData[0]);
          const token = registeredUSer.data.payload.token;

          const body = await httpPost(endpoint, data, statusCode, token);

          await expect(body).toEqual(response);
        },
      );

      it('should validate when email length is valid', async () => {
        const registeredUSer = await authService.register(registerData[0]);
        const token = registeredUSer.data.payload.token;
        const data = {
          ...createUserData[1],
          email: 'x'.repeat(50) + '@email.com',
        };

        const body = await httpPost(endpoint, data, HttpStatus.CREATED, token);

        testValidateUser(body, { id: 2, name: data.name, email: data.email });
      });

      it('should fail when email is already in use', async () => {
        const registeredUsers = [
          await authService.register(registerData[0]),
          await authService.register(registerData[1]),
        ];
        const data = {
          name: 'User 3',
          email: registerData[1].email,
          password: 'Acb123*',
        };
        const token = registeredUsers[0].data.payload.token;

        const body = await httpPost(endpoint, data, HttpStatus.CONFLICT, token);

        await expect(body).toEqual({
          error: 'Conflict',
          message: EmailMessage.INVALID,
          statusCode: HttpStatus.CONFLICT,
        });
      });
    });
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
      const token = registeredUsers[1].data.payload.token;

      const retUpdate = await httpPatch(
        endpoint + '/2',
        updateData,
        HttpStatus.OK,
        token,
      );
      const users = await userRepo.find();

      expect(users).toHaveLength(3);
      testValidateUser(retUpdate, expectedUpdateData[1]);
      testValidateUser(users[0], expectedUpdateData[0]);
      testValidateUser(users[1], expectedUpdateData[1]);
      testValidateUser(users[2], expectedUpdateData[2]);
    });

    it('Should fail in multiple fields', async () => {
      const registeredUSer = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
        await authService.register(registerData[2]),
      ];
      const token = registeredUSer[0].data.payload.token;
      const data = { email: 'invalid', name: 'a' };

      const body = await httpPatch(
        endpoint + '/2',
        data,
        HttpStatus.UNPROCESSABLE_ENTITY,
        token,
      );

      await expect(body).toEqual({
        error: 'UnprocessableEntityException',
        message: {
          email: 'Invalid email',
          name: 'Name must be at least 6 characters long',
        },
        statusCode: 422,
      });
    });

    describe('name', () => {
      it.each(TestUserData.getNameErrorDataList('update'))(
        'should fail if name is $description',
        async ({ data, statusCode, response }) => {
          const registeredUSer = [
            await authService.register(registerData[0]),
            await authService.register(registerData[1]),
            await authService.register(registerData[2]),
          ];
          const token = registeredUSer[0].data.payload.token;

          const body = await httpPatch(
            endpoint + '/2',
            data,
            statusCode,
            token,
          );

          await expect(body).toEqual(response);
        },
      );

      it.each([
        { description: 'null', value: null },
        { description: 'undefined', value: undefined },
      ])('ahould validate when name is $description', async ({ value }) => {
        const newEmail = 'new@email.com';
        const registeredUSer = [
          await authService.register(registerData[0]),
          await authService.register(registerData[1]),
          await authService.register(registerData[2]),
        ];
        const token = registeredUSer[0].data.payload.token;
        const data = { name: value, email: newEmail };

        const body = await httpPatch(
          endpoint + '/2',
          data,
          HttpStatus.OK,
          token,
        );

        testValidateUser(body, {
          id: 2,
          name: registerData[1].name,
          email: newEmail,
        });
      });

      it('should validate name length is valid', async () => {
        const newName = 'x'.repeat(60);

        const registeredUSer = [
          await authService.register(registerData[0]),
          await authService.register(registerData[1]),
          await authService.register(registerData[2]),
        ];
        const token = registeredUSer[0].data.payload.token;
        const data = { name: newName };

        const body = await httpPatch(
          endpoint + '/2',
          data,
          HttpStatus.OK,
          token,
        );

        testValidateUser(body, {
          id: 2,
          name: newName,
          email: registerData[1].email,
        });
      });
    });

    describe('email', () => {
      it.each(TestUserData.getEmailErrorDataList('update'))(
        'should fail if email is $description',
        async ({ data, statusCode, response }) => {
          const registeredUSer = [
            await authService.register(registerData[0]),
            await authService.register(registerData[1]),
            await authService.register(registerData[2]),
          ];
          const token = registeredUSer[0].data.payload.token;

          const body = await httpPatch(
            endpoint + '/2',
            data,
            statusCode,
            token,
          );

          await expect(body).toEqual(response);
        },
      );

      it('should validate when email length is valid', async () => {
        let newName = 'New Name';
        let newEmail = 'newname@email.com';
        let updateData = { name: newName, email: newEmail };

        const registeredUsers = [
          await authService.register(registerData[0]),
          await authService.register(registerData[1]),
          await authService.register(registerData[2]),
        ];
        const body = await httpPatch(
          endpoint + '/100',
          updateData,
          HttpStatus.NOT_FOUND,
          registeredUsers[1].data.payload.token,
        );

        expect(body).toEqual({
          error: 'Not Found',
          message: UserMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      });

      it('should fail if email is already in use', async () => {
        const registeredUSer = [
          await authService.register(registerData[0]),
          await authService.register(registerData[1]),
          await authService.register(registerData[2]),
        ];
        const token = registeredUSer[0].data.payload.token;
        const data = { email: registerData[2].email };

        const body = await httpPatch(
          endpoint + '/2',
          data,
          HttpStatus.CONFLICT,
          token,
        );

        await expect(body).toEqual({
          error: 'Conflict',
          message: 'Invalid email',
          statusCode: 409,
        });
      });
    });

    it('should fail if not authenticated', async () => {
      let newName = 'New Name';
      let newEmail = 'newname@email.com';
      let updateData = { name: newName, email: newEmail };
      await authService.register(registerData[0]);
      await authService.register(registerData[1]);
      await authService.register(registerData[2]);
      const body = await httpPatch(
        endpoint + '/2',
        updateData,
        HttpStatus.UNAUTHORIZED,
      );
      expect(body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
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
      const token = registeredUsers[1].data.payload.token;

      const users = await httpGet(endpoint, {}, HttpStatus.OK, token);

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(3);
      testValidateUser(users[0], expectedData[0]);
      testValidateUser(users[1], expectedData[1]);
      testValidateUser(users[2], expectedData[2]);
    });

    it('should fail if not authenticated', async () => {
      await authService.register(registerData[0]);
      await authService.register(registerData[1]);
      await authService.register(registerData[2]);
      const body = await httpGet(endpoint, {}, HttpStatus.UNAUTHORIZED);
      expect(body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
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
      const token = registeredUsers[1].data.payload.token;

      const user = await httpGet(endpoint + '/2', {}, HttpStatus.OK, token);

      testValidateUser(user, expectedData);
    });

    it('should fail if not authenticated', async () => {
      await authService.register(registerData[0]);
      await authService.register(registerData[1]);
      await authService.register(registerData[2]);
      const body = await httpGet(endpoint + '/2', {}, 401);
      expect(body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should fail if user does not exists', async () => {
      const registeredUsers = [
        await authService.register(registerData[0]),
        await authService.register(registerData[1]),
        await authService.register(registerData[2]),
      ];
      const token = registeredUsers[1].data.payload.token;

      const body = await httpGet(
        endpoint + '/100',
        {},
        HttpStatus.NOT_FOUND,
        token,
      );

      expect(body).toEqual({
        error: 'Not Found',
        message: UserMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    });
  });
});
