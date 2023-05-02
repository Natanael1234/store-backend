import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestServicePagination } from '../../../../test/pagination/test-service-pagination';
import { TestPurpose } from '../../../../test/test-data';
import { getEmailErrorDataList } from '../../../../test/test-data/test-email-data';
import { getNameErrorDataList } from '../../../../test/test-data/test-name-data';
import { getRolesErrorDataList } from '../../../../test/test-data/test-roles-data';
import { getPasswordErrorDataList } from '../../../../test/test-data/test.password-data';
import { TestUserData } from '../../../../test/user/test-user-data';
import { testValidateUser } from '../../../../test/user/test-user-utils';
import { Role } from '../../../authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../authentication/services/authentication/authentication.service';
import { PaginatedResponseDTO } from '../../../system/dtos/response/pagination/pagination.response.dto';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { EmailMessage } from '../../../system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../../../system/enums/messages/name-messages/name-messages.enum';
import { PasswordMessage } from '../../../system/enums/messages/password-messages/password-messages.enum';
import { CreateUserRequestDTO } from '../../dtos/create-user/create-user.request.dto';
import { RoleMessage } from '../../enums/role-messages/role-messages.enum';
import { UserMessage } from '../../enums/user-messages.ts/user-messages.enum';
import { UserEntity } from '../../models/user/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let module: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let encryptionService: EncryptionService;
  let userRepo: Repository<UserEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    userService = module.get<UserService>(UserService);
    authenticationService = module.get<AuthenticationService>(
      AuthenticationService,
    );
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('create', () => {
    it('should create users', async () => {
      const creationData = TestUserData.creationData;

      const createdUsers = [
        await userService.create(creationData[0]),
        await userService.create(creationData[1]),
        await userService.create(creationData[2]),
      ];

      const expectedData = [
        { id: 1, ...creationData[0] },
        { id: 2, ...creationData[1] },
        { id: 3, ...creationData[2] },
      ];
      expectedData.forEach((data) => delete data.password);

      const users = await userRepo.find();

      expect(users).toHaveLength(3);

      testValidateUser(createdUsers[0], expectedData[0]);
      testValidateUser(createdUsers[1], expectedData[1]);
      testValidateUser(createdUsers[2], expectedData[2]);

      testValidateUser(users[0], expectedData[0]);
      testValidateUser(users[1], expectedData[1]);
      testValidateUser(users[2], expectedData[2]);
    });

    it.each([{ user: null }, { user: undefined }])(
      'should fail when user data is $user',
      async ({ user }) => {
        const fn = () => userService.create(user);
        await expect(fn()).rejects.toThrow(UserMessage.DATA_REQUIRED);
        await expect(fn()).rejects.toThrow(BadRequestException);
      },
    );

    describe('fields', () => {
      describe('name', () => {
        it.each(
          getNameErrorDataList(
            TestUserData.creationData[2],
            TestPurpose.create,
          ),
        )(
          'should fail when name is $description',
          async ({ data, exception: expectedException }) => {
            const usersBefore = await userRepo.find();
            try {
              await userService.create(data as CreateUserRequestDTO);
            } catch (ex) {
              expect(usersBefore).toEqual(await userRepo.find());
              expect(ex).toBeInstanceOf(UnprocessableEntityException);
              expect(ex.getResponse()).toEqual(expectedException.getResponse());
            }
          },
        );

        it('should validate if name length is valid', async () => {
          const shortName = 'x'.repeat(6);
          const longName = 'x'.repeat(60);
          const creationData = TestUserData.creationData;
          const expectedData = [
            { id: 1, ...creationData[0], name: shortName },
            { id: 2, ...creationData[1], name: longName },
          ];
          expectedData.forEach((data) => delete data.password);

          const createdUsers = [
            await userService.create({ ...creationData[0], name: shortName }),
            await userService.create({ ...creationData[1], name: longName }),
          ];

          const users = await userRepo.find();

          expect(users).toHaveLength(2);
          testValidateUser(users[0], expectedData[0]);
          testValidateUser(users[1], expectedData[1]);
          testValidateUser(createdUsers[0], expectedData[0]);
          testValidateUser(createdUsers[1], expectedData[1]);
        });
      });

      describe('email', () => {
        it.each(
          getEmailErrorDataList(
            TestUserData.creationData[2],
            TestPurpose.create,
          ),
        )(
          'should fail when email is $description',
          async ({ data, exception: expectedException }) => {
            const usersBefore = await userRepo.find();
            const fn = () => userService.create(data as CreateUserRequestDTO);
            await expect(fn()).rejects.toThrow(UnprocessableEntityException);
            try {
              await fn();
            } catch (ex) {
              expect(ex.getResponse()).toEqual(expectedException.getResponse());
              expect(await userRepo.find()).toEqual(usersBefore);
            }
          },
        );

        it('should fail if email is already in use', async () => {
          const creationData = TestUserData.creationData;
          const createdUsers = [
            await userService.create(creationData[0]),
            await userService.create(creationData[1]),
          ];
          const usersBefore = await userRepo.find();
          const fn = () =>
            userService.create({
              ...creationData[2],
              email: creationData[0].email,
            });

          // const users = await userRepo.findOne({where:{updated: }})
          await expect(fn()).rejects.toThrow(ConflictException);
          try {
            await fn();
          } catch (ex) {
            expect(ex.getResponse()).toEqual({
              error: 'Conflict',
              message: EmailMessage.INVALID,
              statusCode: HttpStatus.CONFLICT,
            });
            expect(await userRepo.find()).toEqual(usersBefore);
          }
        });

        it('should validate if email length is valid', async () => {
          const email = 'x'.repeat(50) + '@email.com';
          const creationData = TestUserData.creationData;
          const expectedData = { id: 1, ...creationData[0], email };
          delete expectedData.password;

          const createdUser = await userService.create({
            ...creationData[0],
            email,
          });
          const users = await userRepo.find();

          expect(users).toHaveLength(1);
          testValidateUser(createdUser, expectedData);
          testValidateUser(users[0], expectedData);
        });
      });

      describe('password', () => {
        it.each(
          getPasswordErrorDataList(
            TestUserData.creationData[2],
            TestPurpose.create,
          ),
        )(
          'should fail when name is $description',
          async ({ data, exception }) => {
            const usersBefore = await userRepo.find();
            const fn = () => userService.create(data as CreateUserRequestDTO);
            await expect(fn()).rejects.toThrow(UnprocessableEntityException);
            try {
              await fn();
            } catch (ex) {
              expect(ex.getResponse()).toEqual(exception.getResponse());
              expect(await userRepo.find()).toEqual(usersBefore);
            }
          },
        );

        it('should validate if password length is valid', async () => {
          const password = 'Abc124***###';
          const creationData = TestUserData.creationData;
          const expectedData = [
            { id: 1, ...creationData[0] },
            { id: 2, ...creationData[1], password },
          ];
          const createdUsers = [
            await userService.create(creationData[0]),
            await userService.create({ ...creationData[1], password }),
          ];

          const usersAfter = await userRepo.find();

          expect(usersAfter).toHaveLength(2);
          testValidateUser(createdUsers[0], expectedData[0]);
          testValidateUser(createdUsers[1], expectedData[1]);
          testValidateUser(usersAfter[0], expectedData[0]);
          testValidateUser(usersAfter[1], expectedData[1]);
        });
      });

      describe('roles', () => {
        it.each(
          getRolesErrorDataList(
            TestUserData.creationData[2],
            TestPurpose.create,
          ),
        )(
          'should fail when roles is $description',
          async ({ data, exception }) => {
            const usersBefore = await userRepo.find();
            const fn = () => userService.create(data as CreateUserRequestDTO);
            await expect(fn()).rejects.toThrow(UnprocessableEntityException);
            try {
              await fn();
            } catch (ex) {
              expect(ex.getResponse()).toEqual(exception.getResponse());
              expect(await userRepo.find()).toEqual(usersBefore);
            }
          },
        );
      });

      describe('multiple errors', () => {
        it('should fail when there are multiple invalid fields', async () => {
          const usersData = TestUserData.creationData;
          const invalidName = 'A';
          const invalidEmail = 'B';
          const invalidPassword = 'C';
          await userService.create(usersData[0]);
          await userService.create(usersData[1]);

          const usersBefore = await userRepo.find();
          async function fn() {
            await userService.create({
              name: invalidName,
              email: invalidEmail,
              password: invalidPassword,
              roles: null,
            });
          }
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
          expect(usersBefore).toEqual(await userRepo.find());
          await expect(fn()).rejects.toThrow('Unprocessable Entity Exception');
          try {
            await fn();
          } catch (error) {
            expect(error.response).toEqual({
              error: UnprocessableEntityException.name,
              message: {
                name: NameMessage.MIN_LEN,
                email: EmailMessage.INVALID,
                password: PasswordMessage.MIN_LEN,
                roles: RoleMessage.REQUIRED,
              },
              statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            });
          }
        });
      });
    });
  });

  describe('find', () => {
    it('should return an empty array when no users are found', async () => {
      const ret = await userService.find();

      expect(ret).toEqual({ count: 0, page: 1, pageSize: 12, results: [] });
    });

    it('should return an array of users', async () => {
      const createData = TestUserData.dataForRepository();
      await userRepo.insert(createData[0]);
      await userRepo.insert(createData[1]);
      await userRepo.insert(createData[2]);

      const registers = await userRepo.find();
      const ret: any = await userService.find();

      expect(ret).toEqual({
        count: 3,
        page: 1,
        pageSize: 12,
        results: registers,
      });
    });

    describe('pagination', () => {
      class TestUserServicePagination extends TestServicePagination<UserEntity> {
        async insertRegisters(quantity: number): Promise<any> {
          let creationData = [];
          for (const data of TestUserData.buildData(quantity)) {
            creationData.push({
              name: data.name,
              email: data.email,
              hash: await encryptionService.encrypt(data.password),
              roles: data.roles,
            });
          }
          await userRepo.insert(creationData);
        }

        findRegisters(options: {
          skip: number;
          take: number;
        }): Promise<[registes: UserEntity[], count: number]> {
          const findManyOptions: any = { where: {} };
          if (options.skip) findManyOptions.skip = options.skip;
          if (options.take) findManyOptions.take = options.take;
          return userRepo.findAndCount(findManyOptions);
        }

        findViaService(pagination?: {
          page?: number;
          pageSize?: number;
        }): Promise<PaginatedResponseDTO<UserEntity>> {
          return userService.find(pagination);
        }
      }

      new TestUserServicePagination().executeTests();
    });
  });

  describe('findForId', () => {
    it('should get a single user', async () => {
      const usersData = TestUserData.dataForRepository();
      const expectedData = { id: 2, ...usersData[1] };
      const createdUsers = [
        userRepo.create(usersData[0]),
        userRepo.create(usersData[1]),
        userRepo.create(usersData[2]),
      ];
      await userRepo.save(createdUsers[0]);
      await userRepo.save(createdUsers[1]);
      await userRepo.save(createdUsers[2]);
      const foundUser = await userService.findForId(2);

      testValidateUser(foundUser, expectedData);
    });

    it('should fail when user is not found', async () => {
      const usersData = TestUserData.creationData;
      await userService.create(usersData[0]);
      await userService.create(usersData[1]);
      await userService.create(usersData[2]);
      async function fn() {
        await userService.findForId(10);
      }
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
    });

    it.each([{ userId: null }, { userId: undefined }])(
      'should fail when user id parameter is $userId',
      async ({ userId }) => {
        const usersData = TestUserData.creationData;
        await userService.create(usersData[0]);
        await userService.create(usersData[1]);
        await userService.create(usersData[2]);
        async function fn() {
          await userService.findForId(userId);
        }
        await expect(fn()).rejects.toThrow(BadRequestException);
        await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
      },
    );
  });

  describe('update', () => {
    it('should update user', async () => {
      const usersData = TestUserData.dataForRepository();
      let name = 'New Name';
      let email = 'newname@email.com';
      let updateData = { name, email };
      let expectedUpdateData = [
        { id: 1, ...usersData[0] },
        { id: 2, ...usersData[1], name, email },
        { id: 3, ...usersData[2] },
      ];
      await userRepo.insert(userRepo.create(usersData[0]));
      await userRepo.insert(userRepo.create(usersData[1]));
      await userRepo.insert(userRepo.create(usersData[2]));

      const retUpdate = await userService.update(2, updateData);
      const users = await userRepo.find();

      expect(users).toHaveLength(3);
      testValidateUser(retUpdate, expectedUpdateData[1]);
      testValidateUser(users[0], expectedUpdateData[0]);
      testValidateUser(users[1], expectedUpdateData[1]);
      testValidateUser(users[2], expectedUpdateData[2]);
    });

    describe('userId', () => {
      it('should fail when user does not exists', async () => {
        const usersData = TestUserData.creationData;
        const newName = 'New Name';
        const newEmail = 'newname@email.com';
        await userService.create(usersData[0]);
        await userService.create(usersData[1]);
        await userService.create(usersData[2]);
        const usersBefore = await userRepo.find();

        async function fn() {
          await userService.update(12, {
            name: newName,
            email: newEmail,
            // roles: [Role.ADMIN],
          });
        }
        await expect(fn()).rejects.toThrow(NotFoundException);
        expect(usersBefore).toEqual(await userRepo.find());
        await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
      });

      it.each([
        { description: null, data: null },
        { description: 'undefined', data: undefined },
      ])('should fail if data is $description', async ({ data }) => {
        const usersData = TestUserData.creationData;
        await userService.create(usersData[0]);
        await userService.create(usersData[1]);

        const fn = userService.update(2, data);

        await expect(fn).rejects.toThrow(BadRequestException);
        await expect(fn).rejects.toThrow(UserMessage.DATA_REQUIRED);
      });
    });

    describe('dto', () => {
      describe('id', () => {
        it.each([{ userId: null }, { userId: undefined }])(
          'should fail when user id is $userId',
          async ({ userId }) => {
            const usersData = TestUserData.creationData;
            await userService.create(usersData[0]);
            await userService.create(usersData[1]);
            await userService.create(usersData[2]);
            const usersBefore = await userRepo.find();
            async function fn() {
              await userService.findForId(userId);
            }

            await expect(fn()).rejects.toThrow(BadRequestException);
            expect(usersBefore).toEqual(await userRepo.find());
            await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
          },
        );
      });

      describe('name', () => {
        it.each(
          getNameErrorDataList(TestUserData.updateData[2], TestPurpose.update),
        )(
          'sould fail when name is $description',
          async ({ data, ExceptionClass, response }) => {
            const creationData = TestUserData.creationData;
            const createdUsers = [
              await userService.create(creationData[0]),
              await userService.create(creationData[1]),
              await userService.create(creationData[2]),
            ];
            const usersBefore = await userRepo.find();

            const fn = async () => {
              await userService.update(2, data);
            };

            await expect(fn()).rejects.toThrow(ExceptionClass);
            expect(usersBefore).toEqual(await userRepo.find());
            expect(await userRepo.find()).toEqual(usersBefore);
            try {
              await fn();
            } catch (ex) {
              expect(ex.response).toEqual(response);
            }
          },
        );

        it('should validate if name length is valid', async () => {
          const usersData = TestUserData.creationData;
          const shortName = 'x'.repeat(6);
          const longName = 'x'.repeat(60);
          const creationData = TestUserData.creationData;
          const expectedData = [
            { id: 1, ...usersData[0], name: shortName },
            { id: 2, ...usersData[1], name: longName },
            { id: 3, ...usersData[2] },
          ];

          await userService.create(creationData[0]);
          await userService.create(creationData[1]);
          await userService.create(creationData[2]);

          const updatedUsers = [
            await userService.update(1, {
              name: shortName,
            }),
            await userService.update(2, {
              name: longName,
            }),
          ];
          const users = await userRepo.find();
          expect(users).toHaveLength(3);

          testValidateUser(updatedUsers[0], expectedData[0]);
          testValidateUser(updatedUsers[1], expectedData[1]);

          testValidateUser(users[0], expectedData[0]);
          testValidateUser(users[1], expectedData[1]);
          testValidateUser(users[2], expectedData[2]);
        });
      });

      describe('email', () => {
        it.each(
          getEmailErrorDataList(TestUserData.updateData[2], TestPurpose.update),
        )(
          'should fail when email is $description',
          async ({ data, ExceptionClass, response }) => {
            const creationData = TestUserData.creationData;
            const createdUsers = [
              await userService.create(creationData[0]),
              await userService.create(creationData[1]),
              await userService.create(creationData[2]),
            ];
            const usersBefore = await userRepo.find();
            const fn = async () => await userService.update(2, data);

            await expect(fn()).rejects.toThrow(ExceptionClass);
            expect(usersBefore).toEqual(await userRepo.find());
            expect(await userRepo.find()).toEqual(usersBefore);
            try {
              await fn();
            } catch (ex) {
              expect(ex.response).toEqual(response);
            }
          },
        );

        it('should validate if email length is valid', async () => {
          const creationData = TestUserData.creationData;
          const email = 'x'.repeat(50) + '@email.com';
          const expectedData = [
            { id: 1, ...creationData[0] },
            { id: 2, ...creationData[1], email },
          ];
          await userService.create(creationData[0]);
          await userService.create(creationData[1]);

          const updatedUsers = [await userService.update(2, { email })];
          const users = await userRepo.find();

          expect(users).toHaveLength(2);
          testValidateUser(updatedUsers[0], expectedData[1]);
          testValidateUser(users[0], expectedData[0]);
          testValidateUser(users[1], expectedData[1]);
        });

        it.skip('should ivalidate refresh tokens if change email', async () => {});
      });

      describe('password', () => {
        it('should not update passwords', async () => {
          const usersData = TestUserData.dataForRepository();

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
            { id: 2, ...usersData[1] },
            { id: 3, ...usersData[2] },
          ];
          await userRepo.insert(userRepo.create(usersData[0]));
          await userRepo.insert(userRepo.create(usersData[1]));
          await userRepo.insert(userRepo.create(usersData[2]));

          const updatedUsers = [
            await userService.update(2, updateData[0]),
            await userService.update(3, updateData[1]),
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
          const usersData = TestUserData.dataForRepository();
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
          await userRepo.insert(userRepo.create(usersData[0]));
          await userRepo.insert(userRepo.create(usersData[1]));

          const updatedUsers = [await userService.update(2, updateData[0])];
          const users = await userRepo.find();

          testValidateUser(updatedUsers[0], expectedUpdateData[1]);
          expect(users).toHaveLength(2);
          testValidateUser(users[0], expectedUpdateData[0]);
          testValidateUser(users[1], expectedUpdateData[1]);
        });
      });

      describe('multiple errors', () => {
        it('should fail when there are multiple invalid fields', async () => {
          const newName = 'A';
          const newEmail = 'B';
          const creationData = TestUserData.creationData;
          await userService.create(creationData[0]);
          await userService.create(creationData[1]);
          await userService.create(creationData[2]);
          const usersBefore = await userRepo.find();

          async function fn() {
            await userService.update(2, {
              name: newName,
              email: newEmail,
              // roles: [],
            });
          }
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
          expect(usersBefore).toEqual(await userRepo.find());
          await expect(fn()).rejects.toThrow('Unprocessable Entity Exception');
          try {
            await fn();
          } catch (error) {
            expect(error.response).toEqual({
              error: UnprocessableEntityException.name,
              message: {
                name: NameMessage.MIN_LEN,
                email: EmailMessage.INVALID,
              },
              statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            });
          }
        });
      });
    });
  });

  describe('checkIfEmailAlreadyInUse', () => {
    it('should check if email already in use', async () => {
      const createData = TestUserData.creationData;
      await userService.create(createData[0]);
      await userService.create(createData[1]);
      await userService.create(createData[2]);

      const retExistentEmail = await userService.checkIfEmailAlreadyInUse(
        createData[1].email,
      );

      expect(retExistentEmail).toBe(true);
      const retInexistentEmail = await userService.checkIfEmailAlreadyInUse(
        'inexistent@email.com',
      );
    });

    it('should check if email is not in use', async () => {
      const createData = TestUserData.creationData;
      await userService.create(createData[0]);
      await userService.create(createData[1]);
      await userService.create(createData[2]);

      const ret = await userService.checkIfEmailAlreadyInUse(
        'notinuse@email.com',
      );

      expect(ret).toBe(false);
    });

    it('should not fail when table is empty', async () => {
      const ret = await userService.checkIfEmailAlreadyInUse(
        'notinuse@email.com',
      );

      expect(ret).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should update password', async () => {
      const password = 'NewPass123*';
      const registerData = TestUserData.registerData;

      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);
      await authenticationService.register(registerData[2]);

      const usersBefore = await userRepo
        .createQueryBuilder('user')
        .addSelect('user.hash')
        .getMany();

      const ret = await userService.updatePassword(2, { password });

      const usersAfter = await userRepo
        .createQueryBuilder('user')
        .addSelect('user.hash')
        .getMany();

      expect(ret).toEqual({ status: 'success' });
      expect(usersAfter.length).toEqual(usersBefore.length);
      expect(usersAfter[0]).toEqual(usersBefore[0]);
      expect({ ...usersAfter[1], hash: null, updated: null }).toEqual({
        ...usersBefore[1],
        hash: null,
        updated: null,
      });
      expect(usersAfter[2]).toEqual(usersBefore[2]);
      const decryptedPasword = await encryptionService.decrypt(
        usersAfter[1].hash,
      );
      expect(decryptedPasword).toEqual(password);
    });

    describe('userId', () => {
      it.each([
        { description: 'null', userId: null },
        { description: 'undefined', userId: undefined },
      ])('should fail if userId is $description', async ({ userId }) => {
        const registerData = TestUserData.registerData;

        await authenticationService.register(registerData[0]);
        await authenticationService.register(registerData[1]);
        await authenticationService.register(registerData[2]);

        const usersBefore = await userRepo
          .createQueryBuilder('user')
          .addSelect('user.hash')
          .getMany();

        const fn = () =>
          userService.updatePassword(userId, {
            password: 'New123*',
          });

        await expect(fn()).rejects.toThrow(BadRequestException);
        await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);

        const usersAfter = await userRepo
          .createQueryBuilder('user')
          .addSelect('user.hash')
          .getMany();

        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail if user does not exists', async () => {
        const createData = TestUserData.creationData;
        await userService.create(createData[0]);
        await userService.create(createData[1]);
        await userService.create(createData[2]);

        const usersBefore = await userRepo
          .createQueryBuilder('user')
          .addSelect('user.hash')
          .getMany();

        const fn = () =>
          userService.updatePassword(200, { password: 'Abc12*' });

        await expect(fn()).rejects.toThrow(NotFoundException);
        await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);

        const usersAfter = await userRepo
          .createQueryBuilder('user')
          .addSelect('user.hash')
          .getMany();

        expect(usersAfter).toStrictEqual(usersBefore);
      });
    });

    describe('dto', () => {
      describe('password', () => {
        it.each([
          { description: 'null', dto: null },
          { description: 'undefined', dto: undefined },
        ])('should fail when password is $description', async ({ dto }) => {
          const registerData = TestUserData.registerData;

          await authenticationService.register(registerData[0]);
          await authenticationService.register(registerData[1]);
          await authenticationService.register(registerData[2]);

          const usersBefore = await userRepo
            .createQueryBuilder('user')
            .addSelect('user.hash')
            .getMany();

          const fn = () => userService.updatePassword(2, dto);

          await expect(fn()).rejects.toThrow(BadRequestException);
          const usersAfter = await userRepo
            .createQueryBuilder('user')
            .addSelect('user.hash')
            .getMany();
          await expect(fn()).rejects.toThrow('Data is required');

          expect(usersAfter).toStrictEqual(usersBefore);
        });

        it.each(
          getPasswordErrorDataList(
            TestUserData.updateData[2],
            TestPurpose.create,
          ),
        )('should fail when password is $description', async ({ data }) => {
          const registerData = TestUserData.registerData;

          await authenticationService.register(registerData[0]);
          await authenticationService.register(registerData[1]);
          await authenticationService.register(registerData[2]);

          const usersBefore = await userRepo
            .createQueryBuilder('user')
            .addSelect('user.hash')
            .getMany();

          const fn = () =>
            userService.updatePassword(2, { password: data.Password });

          await expect(fn()).rejects.toThrow(UnprocessableEntityException);

          const usersAfter = await userRepo
            .createQueryBuilder('user')
            .addSelect('user.hash')
            .getMany();

          await expect(fn()).rejects.toThrow('Unprocessable Entity Exception');
          try {
            await fn();
          } catch (ex) {
            expect(ex.getResponse()).toEqual({
              error: 'UnprocessableEntityException',
              message: {
                password: PasswordMessage.REQUIRED,
              },
              statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            });
          }
          expect(usersAfter).toStrictEqual(usersBefore);
        });
      });
    });

    it.skip('should ivalidate refresh tokens if change email', async () => {});
  });

  describe('resetPassword', () => {
    it.skip('should reset password', async () => {});
  });

  describe('recoverPassword', () => {
    it.skip('should request password recovery link by email password', async () => {});
  });

  describe('recreatePasswordByLink', () => {
    it.skip('should recreate password by link', async () => {});
  });

  describe('countUsers', () => {
    it('should count users', async () => {
      const creationData = TestUserData.creationData;
      await userService.create(creationData[0]);
      await userService.create(creationData[1]);
      await userService.create(creationData[2]);

      const count = await userService.count();

      expect(count).toEqual(3);
    });

    it('should count when no user were created', async () => {
      const count = await userService.count();

      expect(count).toEqual(0);
    });
  });
});
