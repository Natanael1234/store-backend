import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../src/.jest/test-config.module';

import { Role } from '../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { EncryptionService } from '../src/modules/system/encryption/services/encryption/encryption.service';
import { EmailMessage } from '../src/modules/system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../src/modules/system/enums/messages/name-messages/name-messages.enum';
import { PasswordMessage } from '../src/modules/system/enums/messages/password-messages/password-messages.enum';
import { ValidationPipe } from '../src/modules/system/pipes/custom-validation.pipe';
import { RoleMessage } from '../src/modules/user/enums/role-messages/role-messages.enum';
import { UserMessage } from '../src/modules/user/enums/user-messages.ts/user-messages.enum';
import { UserEntity } from '../src/modules/user/models/user/user.entity';
import { TestPurpose } from '../src/test/test-data';
import { getEmailErrorDataList } from '../src/test/test-data/test-email-data';
import { getNameErrorDataList } from '../src/test/test-data/test-name-data';
import { getPasswordErrorDataList } from '../src/test/test-data/test.password-data';
import { TestUserData } from '../src/test/test-user-data';
import { testValidateUser } from '../src/test/test-user-utils';
import {
  TestRequestFunction,
  getHTTPDeleteMethod,
  getHTTPGetMethod,
  getHTTPPatchMethod,
  getHTTPPostMethod,
} from './common/test-request-utils';

const endpoint = '/users';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let authenticationService: AuthenticationService;
  let userRepo: Repository<UserEntity>;
  let encryptionService: EncryptionService;

  let httpGet: TestRequestFunction;
  let httpPost: TestRequestFunction;
  let httpPatch: TestRequestFunction;
  let httpDelete: TestRequestFunction;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    httpGet = getHTTPGetMethod(app);
    httpPost = getHTTPPostMethod(app);
    httpPatch = getHTTPPatchMethod(app);
    httpDelete = getHTTPDeleteMethod(app);

    authenticationService = app.get<AuthenticationService>(
      AuthenticationService,
    );
    userRepo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    encryptionService = app.get<EncryptionService>(EncryptionService);
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
    describe('authentication', () => {
      it('should fail if not authenticated', async () => {
        const createData = TestUserData.creationData;

        const usersBefore = await userRepo.find();
        const body = await httpPost(
          endpoint,
          createData[1],
          HttpStatus.UNAUTHORIZED,
        );
        expect(body).toEqual({
          message: 'Unauthorized',
          statusCode: HttpStatus.UNAUTHORIZED,
        });
        expect(await userRepo.find()).toEqual(usersBefore);
      });
    });

    describe('permissions', () => {
      it('should allow root to create users', async () => {
        const registerData = TestUserData.registerData;
        const usersData = TestUserData.dataForRepository({ passwords: false });
        const createData = TestUserData.creationData;

        const expectedData = [
          { id: 1, ...usersData[0] },
          { id: 2, ...usersData[1] },
          { id: 3, ...usersData[2] },
        ];

        const registeredUser = await authenticationService.register(
          registerData[0],
        );
        const token = registeredUser.data.payload.token;

        const createdUsers = [
          await httpPost(endpoint, createData[1], HttpStatus.CREATED, token),
          await httpPost(endpoint, createData[2], HttpStatus.CREATED, token),
        ];
        const users = await userRepo.find();

        expect(users).toHaveLength(3);
        testValidateUser(createdUsers[0], expectedData[1]);
        testValidateUser(createdUsers[1], expectedData[2]);
        testValidateUser(users[0], expectedData[0]);
        testValidateUser(users[1], expectedData[1]);
        testValidateUser(users[2], expectedData[2]);
      });

      it.each([
        { description: 'admin', role: Role.ADMIN },
        { description: 'user', role: Role.USER },
      ])('should not allow $description to create users', async ({ role }) => {
        const registerData = TestUserData.registerData;
        const createData = TestUserData.creationData;
        const registeredUsers = [
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
        ];
        await userRepo.update(2, { roles: [role] });
        const login = await authenticationService.login(registerData[1]);
        const token = login.data.payload.token;

        const usersBefore = await userRepo.find();
        const body = await httpPost(
          endpoint,
          createData[1],
          HttpStatus.FORBIDDEN,
          token,
        );
        expect(body).toEqual({
          error: 'Forbidden',
          message: 'Forbidden resource',
          statusCode: HttpStatus.FORBIDDEN,
        });
        expect(await userRepo.find()).toEqual(usersBefore);
      });
    });

    describe('dto', () => {
      describe('name', () => {
        it.each(
          getNameErrorDataList(
            TestUserData.creationData[2],
            TestPurpose.create,
          ),
        )(
          'should fail if name is $description',
          async ({ data, statusCode, response }) => {
            let registerData = TestUserData.registerData;
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
          const registerData = TestUserData.registerData;
          const createData = TestUserData.creationData;

          const shortName = 'x'.repeat(6);
          const longName = 'x'.repeat(60);
          const registeredUSer = await authenticationService.register(
            registerData[0],
          );
          const token = registeredUSer.data.payload.token;

          const data = [
            { ...createData[1], name: shortName },
            { ...createData[2], name: longName },
          ];

          const expectedResults = [
            { id: 1, ...createData[0] },
            { id: 2, ...createData[1], name: shortName },
            { id: 3, ...createData[2], name: longName },
          ];

          const createdUsers = [
            await httpPost(endpoint, data[0], HttpStatus.CREATED, token),
            await httpPost(endpoint, data[1], HttpStatus.CREATED, token),
          ];
          const usersAfter = await userRepo.find();

          testValidateUser(createdUsers[0], expectedResults[1]);
          testValidateUser(createdUsers[1], expectedResults[2]);
          expect(usersAfter).toHaveLength(3);
          testValidateUser(usersAfter[0], expectedResults[0]);
          testValidateUser(usersAfter[1], expectedResults[1]);
          testValidateUser(usersAfter[2], expectedResults[2]);
        });
      });

      describe('email', () => {
        it('should fail if email is already in use', async () => {
          const registerData = TestUserData.registerData;
          const createData = TestUserData.creationData;

          const registeredUsers = [
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
          ];
          const data = { ...createData[2], email: registerData[1].email };
          const token = registeredUsers[0].data.payload.token;
          const usersBefore = await userRepo.find();

          const body = await httpPost(
            endpoint,
            data,
            HttpStatus.CONFLICT,
            token,
          );

          expect(await userRepo.find()).toEqual(usersBefore);
          expect(body).toEqual({
            error: 'Conflict',
            message: EmailMessage.INVALID,
            statusCode: HttpStatus.CONFLICT,
          });
        });

        it.each(
          getEmailErrorDataList(
            TestUserData.creationData[2],
            TestPurpose.create,
          ),
        )(
          'should fail if email is $description',
          async ({ data, statusCode, response }) => {
            let registerData = TestUserData.registerData;
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
          const registerData = TestUserData.registerData;
          const createData = TestUserData.creationData;

          const email = 'x'.repeat(50) + '@email.com';
          const registeredUSer = await authenticationService.register(
            registerData[0],
          );
          const token = registeredUSer.data.payload.token;
          const data = { ...createData[1], email };

          const expectedResults = [
            { id: 1, ...createData[0] },
            { id: 2, ...createData[1], email },
          ];
          expectedResults.forEach((data) => delete data.password);

          const createdUser = await httpPost(
            endpoint,
            data,
            HttpStatus.CREATED,
            token,
          );
          const usersAfter = await userRepo.find();

          testValidateUser(createdUser, expectedResults[1]);
          expect(usersAfter).toHaveLength(2);
          testValidateUser(usersAfter[0], expectedResults[0]);
          testValidateUser(usersAfter[1], expectedResults[1]);
        });

        it('should fail when email is already in use', async () => {
          let registerData = TestUserData.registerData;
          const registeredUsers = [
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
          ];
          const data = {
            name: 'User 3',
            email: registerData[1].email,
            password: 'Acb123*',
            roles: [Role.ADMIN],
          };
          const token = registeredUsers[0].data.payload.token;
          const usersBefore = await userRepo.find();

          const body = await httpPost(
            endpoint,
            data,
            HttpStatus.CONFLICT,
            token,
          );

          await expect(body).toEqual({
            error: 'Conflict',
            message: EmailMessage.INVALID,
            statusCode: HttpStatus.CONFLICT,
          });
          expect(await userRepo.find()).toEqual(usersBefore);
        });
      });

      describe('password', () => {
        it.each(
          getPasswordErrorDataList(
            TestUserData.creationData[2],
            TestPurpose.create,
          ),
        )(
          'should fail when password is $description',
          async ({ data, statusCode, response }) => {
            let registerData = TestUserData.registerData;
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
          const registerData = TestUserData.registerData;
          const createData = TestUserData.creationData;

          const shortPassword = 'Abc12*';
          const longPassword = 'Abc12*******';
          const registeredUSer = await authenticationService.register(
            registerData[0],
          );
          const token = registeredUSer.data.payload.token;

          const expectedResults = [
            { id: 1, ...createData[0] },
            { id: 2, ...createData[1] },
            { id: 3, ...createData[2] },
          ];
          expectedResults.forEach((result) => delete result.password);

          const data = [
            { ...createData[1], password: shortPassword },
            { ...createData[2], password: longPassword },
          ];

          const createdUsers = [
            await httpPost(endpoint, data[0], HttpStatus.CREATED, token),
            await httpPost(endpoint, data[1], HttpStatus.CREATED, token),
          ];
          const usersAfter = await userRepo.find();

          testValidateUser(createdUsers[0], expectedResults[1]);
          testValidateUser(createdUsers[1], expectedResults[2]);
          expect(usersAfter).toHaveLength(3);
          testValidateUser(usersAfter[0], expectedResults[0]);
          testValidateUser(usersAfter[1], expectedResults[1]);
          testValidateUser(usersAfter[2], expectedResults[2]);
        });
      });

      describe('multiple errors', () => {
        it('should fail in multiple fields', async () => {
          let registerData = TestUserData.registerData;
          const registeredUSer = await authenticationService.register(
            registerData[0],
          );
          const data = {
            name: 'a',
            email: 'b',
            password: 'c',
            roles: [],
          };
          const token = registeredUSer.data.payload.token;
          const usersBefore = await userRepo.find();

          const body = await httpPost(
            endpoint,
            data,
            HttpStatus.UNPROCESSABLE_ENTITY,
            token,
          );

          await expect(body).toEqual({
            error: 'UnprocessableEntityException',
            message: {
              email: EmailMessage.INVALID,
              name: NameMessage.MIN_LEN,
              password: PasswordMessage.MIN_LEN,
              roles: RoleMessage.MIN_LEN,
            },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
          expect(await userRepo.find()).toEqual(usersBefore);
        });
      });
    });
  });

  describe('/users/:userId (PATCH)', () => {
    describe('authentication', () => {
      it('should fail if not authenticated', async () => {
        let registerData = TestUserData.registerData;
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

    describe('permission', () => {
      it('should allow root to update users', async () => {
        const registerData = TestUserData.registerData;
        const createData = TestUserData.creationData;

        let name = 'New Name';
        let email = 'newname@email.com';
        let data = { name, email };
        let expectedResults = [
          { id: 1, ...createData[0], roles: [Role.ROOT] },
          { id: 2, ...createData[1], name, email, roles: [Role.USER] },
          { id: 3, ...createData[2], roles: [Role.USER] },
        ];
        const registeredUsers = [
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
          await authenticationService.register(registerData[2]),
        ];
        const token = registeredUsers[0].data.payload.token;

        const retUpdate = await httpPatch(
          endpoint + '/2',
          data,
          HttpStatus.OK,
          token,
        );
        const users = await userRepo.find();

        testValidateUser(retUpdate, expectedResults[1]);
        expect(users).toHaveLength(3);
        testValidateUser(users[0], expectedResults[0]);
        testValidateUser(users[1], expectedResults[1]);
        testValidateUser(users[2], expectedResults[2]);
      });

      it.each([
        { description: 'admin', role: Role.ADMIN },
        { description: 'user', role: Role.USER },
      ])('should not allow $description to update users', async ({ role }) => {
        let registerData = TestUserData.registerData;
        let newName = 'New Name';
        let newEmail = 'newname@email.com';
        let updateData = { name: newName, email: newEmail };
        const registeredUsers = [
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
          await authenticationService.register(registerData[2]),
        ];

        await userRepo.update(2, { roles: [role] });
        const usersBefore = await userRepo.find();
        const token = registeredUsers[1].data.payload.token;

        const body = await httpPatch(
          endpoint + '/2',
          updateData,
          HttpStatus.FORBIDDEN,
          token,
        );

        expect(body).toEqual({
          error: 'Forbidden',
          message: 'Forbidden resource',
          statusCode: HttpStatus.FORBIDDEN,
        });
        expect(await userRepo.find()).toEqual(usersBefore);
      });
    });

    describe('dto', () => {
      describe('name', () => {
        it.each(
          getNameErrorDataList(TestUserData.updateData[2], TestPurpose.update),
        )(
          'should fail if name is $description',
          async ({ data, statusCode, response }) => {
            let registerData = TestUserData.registerData;
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
          { description: 'null', name: null },
          { description: 'undefined', name: undefined },
        ])('should validate when name is $description', async ({ name }) => {
          const registerData = TestUserData.registerData;
          const createData = TestUserData.creationData;

          const email = 'new@email.com';
          const registeredUSer = [
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
            await authenticationService.register(registerData[2]),
          ];
          const expectedResult = { id: 2, ...createData[1], email };
          const token = registeredUSer[0].data.payload.token;

          const body = await httpPatch(
            endpoint + '/2',
            { name, email },
            HttpStatus.OK,
            token,
          );

          testValidateUser(body, expectedResult);
        });

        it('should validate name length is valid', async () => {
          const registerData = TestUserData.registerData;
          const createData = TestUserData.creationData;
          const name = 'x'.repeat(60);
          const registeredUSer = [
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
            await authenticationService.register(registerData[2]),
          ];
          const expectedResult = { id: 2, ...createData[1], name };
          delete expectedResult.password;
          const token = registeredUSer[0].data.payload.token;

          const body = await httpPatch(
            endpoint + '/2',
            { name },
            HttpStatus.OK,
            token,
          );

          testValidateUser(body, expectedResult);
        });
      });

      describe('email', () => {
        it.each(
          getEmailErrorDataList(TestUserData.updateData[2], TestPurpose.update),
        )(
          'should fail if email is $description',
          async ({ data, statusCode, response }) => {
            let registerData = TestUserData.registerData;
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
          let registerData = TestUserData.registerData;
          let newName = 'New Name';
          let newEmail = 'newname@email.com';
          let updateData = { name: newName, email: newEmail };

          const registeredUsers = [
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
            await authenticationService.register(registerData[2]),
          ];
          const token = registeredUsers[0].data.payload.token;

          const body = await httpPatch(
            endpoint + '/100',
            updateData,
            HttpStatus.NOT_FOUND,
            token,
          );

          expect(body).toEqual({
            error: 'Not Found',
            message: UserMessage.NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
          });
        });

        it('should fail if email is already in use', async () => {
          let registerData = TestUserData.registerData;
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

      describe('password', () => {
        it('should not update passwords', async () => {
          const usersData = TestUserData.dataForRepository({
            passwords: false,
          });
          const registerData = TestUserData.registerData;

          let updateData = [
            {
              name1: undefined,
              email: undefined,
              password: 'Xyz987*',
            },
            {
              name: undefined,
              email: undefined,
              hash: { iv: 'iv', encryptedData: 'encryptedData' },
            },
          ];
          let expectedUpdateData = [
            { id: 1, ...usersData[0] },
            { id: 2, ...usersData[1], roles: [Role.USER] },
            { id: 3, ...usersData[2], roles: [Role.USER] },
          ];

          const registeredUsers = [
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
            await authenticationService.register(registerData[2]),
          ];
          const token = registeredUsers[0].data.payload.token;

          const updatedUsers = [
            await httpPatch(
              endpoint + '/2',
              updateData[0],
              HttpStatus.OK,
              token,
            ),
            await httpPatch(
              endpoint + '/3',
              updateData[1],
              HttpStatus.OK,
              token,
            ),
          ];

          const users = await userRepo.find();

          testValidateUser(updatedUsers[0], expectedUpdateData[1]);
          testValidateUser(updatedUsers[1], expectedUpdateData[2]);

          expect(users).toHaveLength(3);
          testValidateUser(users[0], expectedUpdateData[0]);
          testValidateUser(users[1], expectedUpdateData[1]);
          testValidateUser(users[2], expectedUpdateData[2]);
        });
      });

      describe('roles', () => {
        it('should not update roles', async () => {
          const usersData = TestUserData.dataForRepository({
            passwords: false,
          });
          const registerData = TestUserData.registerData;

          let updateData = [
            {
              name1: undefined,
              email: undefined,
              roles: [Role.ADMIN],
            },
          ];
          let expectedUpdateData = [
            { id: 1, ...usersData[0] },
            { id: 2, ...usersData[1] },
          ];

          const registeredUsers = [
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
          ];
          const token = registeredUsers[0].data.payload.token;

          const updatedUsers = [
            await httpPatch(
              endpoint + '/2',
              updateData[0],
              HttpStatus.OK,
              token,
            ),
          ];

          const users = await userRepo.find();

          testValidateUser(updatedUsers[0], expectedUpdateData[1]);

          expect(users).toHaveLength(2);
          testValidateUser(users[0], expectedUpdateData[0]);
          testValidateUser(users[1], expectedUpdateData[1]);
        });
      });

      describe('multiple fields', () => {
        it('should fail in multiple fields', async () => {
          let registerData = TestUserData.registerData;
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
      });
    });
  });

  describe('/users (GET)', () => {
    it('should find users', async () => {
      const registerData = TestUserData.registerData;
      const createData = TestUserData.creationData;

      const registeredUsers = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const expectedResults = [
        { id: 1, ...createData[0], roles: [Role.ROOT] },
        { id: 2, ...createData[1], roles: [Role.USER] },
        { id: 3, ...createData[2], roles: [Role.USER] },
      ];
      expectedResults.forEach(
        (expectedResults) => delete expectedResults.password,
      );
      const token = registeredUsers[0].data.payload.token;
      const usersBefore = await userRepo.find();

      const users = await httpGet(endpoint, {}, HttpStatus.OK, token);

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(3);
      testValidateUser(users[0], expectedResults[0]);
      testValidateUser(users[1], expectedResults[1]);
      testValidateUser(users[2], expectedResults[2]);

      expect(await userRepo.find()).toEqual(usersBefore);
    });

    it('should fail if not authenticated', async () => {
      let registerData = TestUserData.registerData;
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

    it('should fail if user not authorized', async () => {
      let registerData = TestUserData.registerData;
      const registeredUsers = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const token = registeredUsers[2].data.payload.token;
      const usersBefore = await userRepo.find();

      const body = await httpGet(endpoint, {}, HttpStatus.FORBIDDEN, token);
      expect(body).toEqual({
        message: 'Forbidden resource',
        error: 'Forbidden',
        statusCode: HttpStatus.FORBIDDEN,
      });
      expect(await userRepo.find()).toEqual(usersBefore);
    });
  });

  describe('/users/:userId (GET)', () => {
    it('should find one user', async () => {
      const registerData = TestUserData.registerData;
      const createData = TestUserData.creationData;

      const registeredUsers = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const expectedData = { id: 2, ...createData[1] };
      delete expectedData.password;

      const token = registeredUsers[0].data.payload.token;
      const usersBefore = await userRepo.find();

      const user = await httpGet(endpoint + '/2', {}, HttpStatus.OK, token);

      testValidateUser(user, expectedData);
      expect(await userRepo.find()).toEqual(usersBefore);
    });

    it('should fail if not authenticated', async () => {
      let registerData = TestUserData.registerData;
      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);
      await authenticationService.register(registerData[2]);
      const body = await httpGet(endpoint + '/2', {}, HttpStatus.UNAUTHORIZED);
      const usersBefore = await userRepo.find();

      expect(body).toEqual({
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      expect(await userRepo.find()).toEqual(usersBefore);
    });

    it('should fail if user has no permission', async () => {
      let registerData = TestUserData.registerData;
      const registeredUsers = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const token = registeredUsers[2].data.payload.token;
      const body = await httpGet(
        endpoint + '/2',
        {},
        HttpStatus.FORBIDDEN,
        token,
      );
      const usersBefore = await userRepo.find();

      expect(body).toEqual({
        message: 'Forbidden resource',
        error: 'Forbidden',
        statusCode: HttpStatus.FORBIDDEN,
      });
      expect(await userRepo.find()).toEqual(usersBefore);
    });

    it('should fail if user not authorized', async () => {
      let registerData = TestUserData.registerData;
      const registeredUsers = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const token = registeredUsers[0].data.payload.token;
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

  describe('/users/password (PATCH)', () => {
    describe('authentication', () => {
      it('should fail if not authenticated', async () => {
        const password = 'Newpass123*';
        let registerData = TestUserData.registerData;
        const registeredUsers = [
          await authenticationService.register(registerData[0]),
          await authenticationService.register(registerData[1]),
          await authenticationService.register(registerData[2]),
        ];

        const usersBefore = await userRepo
          .createQueryBuilder('user')
          .addSelect('user.hash')
          .getMany();

        const body = await httpPatch(
          endpoint + '/password',
          { password },
          HttpStatus.UNAUTHORIZED,
        );

        const usersAfter = await userRepo
          .createQueryBuilder('user')
          .addSelect('user.hash')
          .getMany();

        expect(body).toEqual({
          message: 'Unauthorized',
          statusCode: HttpStatus.UNAUTHORIZED,
        });

        expect(usersAfter).toStrictEqual(usersBefore);
      });
    });

    describe('permissions', () => {
      it.each([{ role: Role.ROOT }, { role: Role.ADMIN }, { role: Role.USER }])(
        'should update password when user is $role',
        async ({ role }) => {
          const password = 'Newpass123*';
          let registerData = TestUserData.registerData;
          const registeredUsers = [
            await authenticationService.register(registerData[0]),
            await authenticationService.register(registerData[1]),
            await authenticationService.register(registerData[2]),
          ];
          await userRepo.update(1, { roles: [role] });
          const token = registeredUsers[0].data.payload.token;

          const usersBefore = await userRepo
            .createQueryBuilder('user')
            .addSelect('user.hash')
            .getMany();

          const body = await httpPatch(
            endpoint + '/password',
            { password },
            HttpStatus.OK,
            token,
          );

          expect(body).toEqual({ status: 'success' });

          const usersAfter = await userRepo
            .createQueryBuilder('user')
            .addSelect('user.hash')
            .getMany();

          expect({
            ...usersAfter[0],
            hash: undefined,
            updated: undefined,
          }).toStrictEqual({
            ...usersBefore[0],
            hash: undefined,
            updated: undefined,
          });
          expect(usersAfter[1]).toStrictEqual(usersBefore[1]);
          expect(usersAfter[2]).toStrictEqual(usersBefore[2]);
          const decryptedPasword = await encryptionService.decrypt(
            usersAfter[0].hash,
          );
          expect(decryptedPasword).toEqual(password);
        },
      );
    });

    describe('dto', () => {
      describe('password', () => {
        it.each(
          getPasswordErrorDataList(
            TestUserData.updateData[2],
            TestPurpose.create,
          ),
        )(
          'should fail when password is $description',
          async ({ data, response }) => {
            const registerData = TestUserData.registerData;
            const registeredUsers = [
              await authenticationService.register(registerData[0]),
              await authenticationService.register(registerData[1]),
              await authenticationService.register(registerData[2]),
            ];
            const token = registeredUsers[0].data.payload.token;

            const usersBefore = await userRepo
              .createQueryBuilder('user')
              .addSelect('user.hash')
              .getMany();

            const body = await httpPatch(
              endpoint + '/password',
              { password: data.password },
              HttpStatus.UNPROCESSABLE_ENTITY,
              token,
            );

            const usersAfter = await userRepo
              .createQueryBuilder('user')
              .addSelect('user.hash')
              .getMany();

            expect(body).toEqual(response);

            expect(usersAfter).toStrictEqual(usersBefore);
          },
        );
      });
    });
  });

  describe('/users/password/reset (PATCH)', () => {
    it.skip('should reset password', async () => {});
  });

  describe('/users/password/recover (PATCH)', () => {
    it.skip('should request password recovery link by email password', async () => {});
  });

  describe('/users/password/recreate (PATCH)', () => {
    it.skip('should change password by link', async () => {});
  });
});
