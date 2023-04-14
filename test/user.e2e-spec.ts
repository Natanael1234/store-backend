import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';

import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { ValidationPipe } from '../src/modules/pipes/custom-validation.pipe';
import { EmailMessage } from '../src/modules/user/enums/email-messages/email-messages.enum';
import { UserMessage } from '../src/modules/user/enums/user-messages.ts/user-messages.enum';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { TestUserData } from '../src/test/test-user-data';
import { testValidateUser } from '../src/test/test-user-utils';

const usersData = TestUserData.usersData;
const createUserData = TestUserData.userCreationData;
const registerData = TestUserData.registerData;

const endpoint = '/users';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let authenticationService: AuthenticationService;
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
    authenticationService = app.get<AuthenticationService>(
      AuthenticationService,
    );
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
      const registeredUser = await authenticationService.register(
        registerData[0],
      );
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
      const usersBefore = await userRepo.find();
      const body = await httpPost(
        endpoint,
        createUserData[1],
        HttpStatus.UNAUTHORIZED,
      );
      expect(body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      expect(await userRepo.find()).toEqual(usersBefore);
    });

    describe('name', () => {
      it.each(TestUserData.getNameErrorDataList('create'))(
        'should fail if name is $description',
        async ({ data, statusCode, response }) => {
          const registeredUSer = await authenticationService.register(
            registerData[0],
          );
          const token = registeredUSer.data.payload.token;
          const usersBefore = await userRepo.find();

          const body = await httpPost(endpoint, data, statusCode, token);

          await expect(body).toEqual(response);
          expect(await userRepo.find()).toEqual(usersBefore);
        },
      );

      it('should validate when name length is valid', async () => {
        const shortName = 'x'.repeat(6);
        const longName = 'x'.repeat(60);
        const registeredUSer = await authenticationService.register(
          registerData[0],
        );
        const token = registeredUSer.data.payload.token;

        const data = [
          {
            ...createUserData[1],
            name: shortName,
          },
          {
            ...createUserData[2],
            name: longName,
          },
        ];

        const createdUsers = [
          await httpPost(endpoint, data[0], HttpStatus.CREATED, token),
          await httpPost(endpoint, data[1], HttpStatus.CREATED, token),
        ];
        const usersAfter = await userRepo.find();

        testValidateUser(createdUsers[0], {
          id: 2,
          name: data[0].name,
          email: data[0].email,
        });
        testValidateUser(createdUsers[1], {
          id: 3,
          name: data[1].name,
          email: data[1].email,
        });
        expect(usersAfter).toHaveLength(3);
        testValidateUser(usersAfter[0], { id: 1, ...registerData[0] });
        testValidateUser(usersAfter[1], {
          id: 2,
          ...registerData[1],
          name: shortName,
        });
        testValidateUser(usersAfter[2], {
          id: 3,
          ...registerData[2],
          name: longName,
        });
      });
    });

    describe('email', () => {
      it('should fail if email is already in use', async () => {
        const registeredUsers = [
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
        ];
        const data = { ...registerData[2], email: registerData[1].email };
        const token = registeredUsers[0].data.payload.token;
        const usersBefore = await userRepo.find();

        const body = await httpPost(endpoint, data, HttpStatus.CONFLICT, token);

        expect(await userRepo.find()).toEqual(usersBefore);
        expect(body).toEqual({
          error: 'Conflict',
          message: EmailMessage.INVALID,
          statusCode: HttpStatus.CONFLICT,
        });
      });

      it.each(TestUserData.getEmailErrorDataList('create'))(
        'should fail if email is $description',
        async ({ data, statusCode, response }) => {
          const registeredUSer = await authenticationService.register(
            registerData[0],
          );
          const token = registeredUSer.data.payload.token;
          const usersBefore = await userRepo.find();

          const body = await httpPost(endpoint, data, statusCode, token);

          await expect(body).toEqual(response);
          expect(await userRepo.find()).toEqual(usersBefore);
        },
      );

      it('should validate when email length is valid', async () => {
        const longEmail = 'x'.repeat(50) + '@email.com';
        const registeredUSer = await authenticationService.register(
          registerData[0],
        );
        const token = registeredUSer.data.payload.token;
        const data = {
          ...createUserData[1],
          email: longEmail,
        };

        const body = await httpPost(endpoint, data, HttpStatus.CREATED, token);
        const usersAfter = await userRepo.find();

        testValidateUser(body, { id: 2, name: data.name, email: data.email });

        expect(usersAfter).toHaveLength(2);
        testValidateUser(usersAfter[0], { id: 1, ...registerData[0] });
        testValidateUser(usersAfter[1], {
          id: 2,
          ...registerData[1],
          email: longEmail,
        });
      });

      it('should fail when email is already in use', async () => {
        const registeredUsers = [
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
        ];
        const data = {
          name: 'User 3',
          email: registerData[1].email,
          password: 'Acb123*',
        };
        const token = registeredUsers[0].data.payload.token;
        const usersBefore = await userRepo.find();

        const body = await httpPost(endpoint, data, HttpStatus.CONFLICT, token);

        await expect(body).toEqual({
          error: 'Conflict',
          message: EmailMessage.INVALID,
          statusCode: HttpStatus.CONFLICT,
        });
        expect(await userRepo.find()).toEqual(usersBefore);
      });
    });

    describe('password', () => {
      it.each(TestUserData.getPasswordErrorDataList('create'))(
        'should fail when password is $description',
        async ({ data, statusCode, response }) => {
          const registeredUSer = await authenticationService.register(
            registerData[0],
          );
          const token = registeredUSer.data.payload.token;
          const usersBefore = await userRepo.find();

          const body = await httpPost(endpoint, data, statusCode, token);

          await expect(body).toEqual(response);
          expect(await userRepo.find()).toEqual(usersBefore);
        },
      );

      it('should validate when password length is valid', async () => {
        const shortPassword = 'Abc12*';
        const longPassword = 'Abc12*******';
        const registeredUSer = await authenticationService.register(
          registerData[0],
        );
        const token = registeredUSer.data.payload.token;

        const data = [
          {
            ...createUserData[1],
            password: shortPassword,
          },
          {
            ...createUserData[2],
            password: longPassword,
          },
        ];

        const createdUsers = [
          await httpPost(endpoint, data[0], HttpStatus.CREATED, token),
          await httpPost(endpoint, data[1], HttpStatus.CREATED, token),
        ];
        const usersAfter = await userRepo.find();

        testValidateUser(createdUsers[0], {
          id: 2,
          name: data[0].name,
          email: data[0].email,
        });
        testValidateUser(createdUsers[1], {
          id: 3,
          name: data[1].name,
          email: data[1].email,
        });
        expect(usersAfter).toHaveLength(3);
        testValidateUser(usersAfter[0], { id: 1, ...registerData[0] });
        testValidateUser(usersAfter[1], {
          id: 2,
          ...registerData[1],
        });
        testValidateUser(usersAfter[2], {
          id: 3,
          ...registerData[2],
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
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
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
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const data = { email: 'invalid', name: 'a' };
      const token = registeredUSer[0].data.payload.token;
      const usersBefore = await userRepo.find();

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
      expect(await userRepo.find()).toEqual(usersBefore);
    });

    describe('name', () => {
      it.each(TestUserData.getNameErrorDataList('update'))(
        'should fail if name is $description',
        async ({ data, statusCode, response }) => {
          const registeredUSer = [
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
            await authenticationService.register(registerData[2]),
          ];
          const token = registeredUSer[0].data.payload.token;
          const usersBefore = await userRepo.find();

          const body = await httpPatch(
            endpoint + '/2',
            data,
            statusCode,
            token,
          );

          await expect(body).toEqual(response);
          expect(await userRepo.find()).toEqual(usersBefore);
        },
      );

      it.each([
        { description: 'null', value: null },
        { description: 'undefined', value: undefined },
      ])('should validate when name is $description', async ({ value }) => {
        const newEmail = 'new@email.com';
        const registeredUSer = [
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
          await authenticationService.register(registerData[2]),
        ];
        const data = { name: value, email: newEmail };
        const token = registeredUSer[0].data.payload.token;

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
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
          await authenticationService.register(registerData[2]),
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
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
            await authenticationService.register(registerData[2]),
          ];
          const token = registeredUSer[0].data.payload.token;
          const usersBefore = await userRepo.find();

          const body = await httpPatch(
            endpoint + '/2',
            data,
            statusCode,
            token,
          );

          await expect(body).toEqual(response);
          expect(await userRepo.find()).toEqual(usersBefore);
        },
      );

      it('should validate when email length is valid', async () => {
        let newName = 'New Name';
        let newEmail = 'newname@email.com';
        let updateData = { name: newName, email: newEmail };

        const registeredUsers = [
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
          await authenticationService.register(registerData[2]),
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
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
          await authenticationService.register(registerData[2]),
        ];
        const data = { email: registerData[2].email };
        const token = registeredUSer[0].data.payload.token;
        const usersBefore = await userRepo.find();

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
        expect(await userRepo.find()).toEqual(usersBefore);
      });
    });

    it('should fail if not authenticated', async () => {
      let newName = 'New Name';
      let newEmail = 'newname@email.com';
      let updateData = { name: newName, email: newEmail };
      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);
      await authenticationService.register(registerData[2]);
      const usersBefore = await userRepo.find();

      const body = await httpPatch(
        endpoint + '/2',
        updateData,
        HttpStatus.UNAUTHORIZED,
      );

      expect(body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      expect(await userRepo.find()).toEqual(usersBefore);
    });
  });

  describe('/users (GET)', () => {
    it('should find users', async () => {
      const registeredUsers = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const expectedData = [
        { id: 1, name: registerData[0].name, email: registerData[0].email },
        { id: 2, name: registerData[1].name, email: registerData[1].email },
        { id: 3, name: registerData[2].name, email: registerData[2].email },
      ];
      const token = registeredUsers[1].data.payload.token;
      const usersBefore = await userRepo.find();

      const users = await httpGet(endpoint, {}, HttpStatus.OK, token);

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(3);
      testValidateUser(users[0], expectedData[0]);
      testValidateUser(users[1], expectedData[1]);
      testValidateUser(users[2], expectedData[2]);

      expect(await userRepo.find()).toEqual(usersBefore);
    });

    it('should fail if not authenticated', async () => {
      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);
      await authenticationService.register(registerData[2]);
      const usersBefore = await userRepo.find();

      const body = await httpGet(endpoint, {}, HttpStatus.UNAUTHORIZED);
      expect(body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      expect(await userRepo.find()).toEqual(usersBefore);
    });
  });

  describe('/users/:userId (GET)', () => {
    it('should find one user', async () => {
      const registeredUsers = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const expectedData = {
        id: 2,
        name: registerData[1].name,
        email: registerData[1].email,
      };
      const token = registeredUsers[1].data.payload.token;
      const usersBefore = await userRepo.find();

      const user = await httpGet(endpoint + '/2', {}, HttpStatus.OK, token);

      testValidateUser(user, expectedData);
      expect(await userRepo.find()).toEqual(usersBefore);
    });

    it('should fail if not authenticated', async () => {
      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);
      await authenticationService.register(registerData[2]);
      const body = await httpGet(endpoint + '/2', {}, 401);
      const usersBefore = await userRepo.find();

      expect(body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      expect(await userRepo.find()).toEqual(usersBefore);
    });

    it('should fail if user does not exists', async () => {
      const registeredUsers = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const token = registeredUsers[1].data.payload.token;
      const usersBefore = await userRepo.find();

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
      expect(await userRepo.find()).toEqual(usersBefore);
    });
  });
});
