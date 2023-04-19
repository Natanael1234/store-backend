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
import { TestUserData } from '../../../../test/test-user-data';
import { testValidateUser } from '../../../../test/test-user-utils';
import { CreateUserRequestDTO } from '../../dtos/create-user/create-user.request.dto';
import { EmailMessage } from '../../enums/email-messages/email-messages.enum';
import { NameMessage } from '../../enums/name-messages/name-messages.enum';
import { PasswordMessage } from '../../enums/password-messages/password-messages.enum';
import { RoleMessage } from '../../enums/role-messages/role-messages.enum';
import { UserMessage } from '../../enums/user-messages.ts/user-messages.enum';
import { UserEntity } from '../../models/user/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let module: TestingModule;
  let userService: UserService;
  let userRepo: Repository<UserEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    userService = module.get<UserService>(UserService);
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('create', () => {
    it('should create users', async () => {
      const creationData = TestUserData.userCreationData;

      try {
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
      } catch (error) {
        throw error;
      }
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
        it.each(TestUserData.getNameErrorDataList('create'))(
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
          const creationData = TestUserData.userCreationData;
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
        it.each(TestUserData.getEmailErrorDataList('create'))(
          'should fail when email is $description',
          async ({ data, exception: expectedException }) => {
            const usersBefore = await userRepo.find();
            const fn = () => userService.create(data as CreateUserRequestDTO);
            expect(fn()).rejects.toThrow(UnprocessableEntityException);
            try {
              await fn();
            } catch (ex) {
              expect(ex.getResponse()).toEqual(expectedException.getResponse());
              expect(await userRepo.find()).toEqual(usersBefore);
            }
          },
        );

        it('should fail if email is already in use', async () => {
          const creationData = TestUserData.userCreationData;
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
          expect(fn()).rejects.toThrow(ConflictException);
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
          const creationData = TestUserData.userCreationData;
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
        it.each(TestUserData.getPasswordErrorDataList('create'))(
          'should fail when name is $description',
          async ({ data, exception }) => {
            const usersBefore = await userRepo.find();
            const fn = () => userService.create(data as CreateUserRequestDTO);
            expect(fn()).rejects.toThrow(UnprocessableEntityException);
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
          const creationData = TestUserData.userCreationData;
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
        it.each(TestUserData.getRolesErrorDataList('create'))(
          'should fail when roles is $description',
          async ({ data, exception }) => {
            const usersBefore = await userRepo.find();
            const fn = () => userService.create(data as CreateUserRequestDTO);
            expect(fn()).rejects.toThrow(UnprocessableEntityException);
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
          const usersData = TestUserData.userCreationData;
          const invalidName = 'A';
          const invalidEmail = 'B';
          const invalidPassword = 'C';
          await userService.create(usersData[0]);
          await userService.create(usersData[1]);

          const usersBefore = await userService.findAll();
          async function fn() {
            await userService.create({
              name: invalidName,
              email: invalidEmail,
              password: invalidPassword,
              roles: null,
            });
          }
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
          expect(usersBefore).toEqual(await userService.findAll());
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
      const users = await userService.findAll();
      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(0);
    });

    it('should return an array of users', async () => {
      const createData = TestUserData.usersData();
      const createdUSers = [
        userRepo.create(createData[0]),
        userRepo.create(createData[1]),
        userRepo.create(createData[2]),
      ];
      await userRepo.save(createdUSers[0]);
      await userRepo.save(createdUSers[1]);
      await userRepo.save(createdUSers[2]);
      const users = await userService.findAll();
      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(3);
      const expectedData = [
        { id: 1, ...createData[0] },
        { id: 2, ...createData[1] },
        { id: 3, ...createData[2] },
      ];
      expectedData.forEach((data) => delete data.password);

      testValidateUser(users[0], expectedData[0]);
      testValidateUser(users[1], expectedData[1]);
      testValidateUser(users[2], expectedData[2]);
    });
  });

  describe('findForId', () => {
    it('should get a single user', async () => {
      const usersData = TestUserData.usersData();
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
      const usersData = TestUserData.userCreationData;
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
        const usersData = TestUserData.userCreationData;
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
      const usersData = TestUserData.usersData();
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
        const usersData = TestUserData.userCreationData;
        const newName = 'New Name';
        const newEmail = 'newname@email.com';
        await userService.create(usersData[0]);
        await userService.create(usersData[1]);
        await userService.create(usersData[2]);
        const usersBefore = await userService.findAll();

        async function fn() {
          await userService.update(12, {
            name: newName,
            email: newEmail,
            // roles: [Role.ADMIN],
          });
        }
        await expect(fn()).rejects.toThrow(NotFoundException);
        expect(usersBefore).toEqual(await userService.findAll());
        await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
      });

      it.each([
        { description: null, data: null },
        { description: 'undefined', data: undefined },
      ])('should fail if data is $description', async ({ data }) => {
        const usersData = TestUserData.userCreationData;
        await userService.create(usersData[0]);
        await userService.create(usersData[1]);
        const usersBefore = await userService.findAll();

        const fn = userService.update(2, data);

        await expect(fn).rejects.toThrow(BadRequestException);
        await expect(fn).rejects.toThrow(UserMessage.DATA_REQUIRED);
      });
    });

    describe('dto fields', () => {
      describe('id', () => {
        it.each([{ userId: null }, { userId: undefined }])(
          'should fail when user id is $userId',
          async ({ userId }) => {
            const usersData = TestUserData.userCreationData;
            await userService.create(usersData[0]);
            await userService.create(usersData[1]);
            await userService.create(usersData[2]);
            const usersBefore = await userService.findAll();
            async function fn() {
              await userService.findForId(userId);
            }

            await expect(fn()).rejects.toThrow(BadRequestException);
            expect(usersBefore).toEqual(await userService.findAll());
            await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
          },
        );
      });

      describe('name', () => {
        it.each(TestUserData.getNameErrorDataList('update'))(
          'sould fail when name is $description',
          async ({ data, ExceptionClass, response }) => {
            const creationData = TestUserData.userCreationData;
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
            expect(usersBefore).toEqual(await userService.findAll());
            expect(await userRepo.find()).toEqual(usersBefore);
            try {
              await fn();
            } catch (ex) {
              expect(ex.response).toEqual(response);
            }
          },
        );

        it('should validate if name length is valid', async () => {
          const usersData = TestUserData.userCreationData;
          const shortName = 'x'.repeat(6);
          const longName = 'x'.repeat(60);
          const creationData = TestUserData.userCreationData;
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
        it.each(TestUserData.getEmailErrorDataList('update'))(
          'should fail when email is $description',
          async ({ data, ExceptionClass, response }) => {
            const creationData = TestUserData.userCreationData;
            const createdUsers = [
              await userService.create(creationData[0]),
              await userService.create(creationData[1]),
              await userService.create(creationData[2]),
            ];
            const usersBefore = await userRepo.find();
            const fn = async () => await userService.update(2, data);

            await expect(fn()).rejects.toThrow(ExceptionClass);
            expect(usersBefore).toEqual(await userService.findAll());
            expect(await userRepo.find()).toEqual(usersBefore);
            try {
              await fn();
            } catch (ex) {
              expect(ex.response).toEqual(response);
            }
          },
        );

        it('should validate if email length is valid', async () => {
          const creationData = TestUserData.userCreationData;
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
      });

      describe('password', () => {
        it.skip('should not update passwords', async () => {});
      });

      describe('roles', () => {
        it.skip('should not update roles', async () => {});
      });

      describe('multiple errors', () => {
        it('should fail when there are multiple invalid fields', async () => {
          const newName = 'A';
          const newEmail = 'B';
          const creationData = TestUserData.userCreationData;
          await userService.create(creationData[0]);
          await userService.create(creationData[1]);
          await userService.create(creationData[2]);
          const usersBefore = await userService.findAll();

          async function fn() {
            await userService.update(2, {
              name: newName,
              email: newEmail,
              // roles: [],
            });
          }
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
          expect(usersBefore).toEqual(await userService.findAll());
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
    it.skip('should check if email already in use', async () => {});
  });

  describe('updatePassword', () => {
    it.skip('should update password', async () => {});
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
      const creationData = TestUserData.userCreationData;
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
