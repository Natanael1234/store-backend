import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../models/user/user.entity';
import { UserService } from './user.service';
import { getTestingModule } from '../../../../.jest/test-config.module';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  testCreateUser,
  testFindUserForId,
  testFindUsers,
  testUpdateUser,
  testValidateUser,
  usersData,
} from '../../test-user-utils';

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
      await testCreateUser(userRepo, (userData: any) =>
        userService.create(userData),
      );
    });

    it.each([{ user: null }, { user: undefined }])(
      'should fail when user data is $user',
      async ({ user }) => {
        const fn = () => userService.create(user);
        await expect(fn()).rejects.toThrow('User data is required');
        await expect(fn()).rejects.toThrow(BadRequestException);
      },
    );

    describe('email', () => {
      it.each([
        { emailDescription: null, email: null },
        { emailDescription: undefined, email: undefined },
        { emailDescription: 'empty', email: '' },
      ])('should fail when email is $emailDescription', async ({ email }) => {
        const fn = () =>
          userService.create({
            name: 'User 3',
            email,
            password: '12345',
          });

        await expect(fn()).rejects.toThrow('Email is required');
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });
    });

    describe('name', () => {
      it.each([
        { nameDescription: null, name: null },
        { nameDescription: undefined, name: undefined },
        { nameDescription: 'empty', name: '' },
      ])('should fail when name is $nameDescription', async ({ name }) => {
        const fn = () =>
          userService.create({
            name,
            email: 'user@email.com',
            password: '12345',
          });

        await expect(fn()).rejects.toThrow('Name is required');
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });
    });

    describe('password', () => {
      it.each([
        { passwordDescription: null, password: null },
        { passwordDescription: undefined, password: undefined },
        { passwordDescription: 'empty', password: '' },
      ])(
        'should fail when name is $passwordDescription',
        async ({ password }) => {
          const fn = () =>
            userService.create({
              name: 'User',
              email: 'user@email.com',
              password,
            });

          await expect(fn()).rejects.toThrow('Password is required');
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });
  });

  describe('find', () => {
    it('should return an empty array when no users are found', async () => {
      const users = await userService.findAll();
      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(0);
    });

    it('should return an array of users', async () => {
      await testFindUsers(userRepo, () => userService.findAll());
    });
  });

  describe('findForId', () => {
    it('should get a single user', async () => {
      await testFindUserForId(userRepo, (userId: number) =>
        userService.findForId(userId),
      );
    });

    it('should fail when user is not found', async () => {
      await userService.create(usersData[0]);
      await userService.create(usersData[1]);
      await userService.create(usersData[2]);
      async function fn() {
        await userService.findForId(10);
      }
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow('User not found');
    });

    it.each([
      {
        userId: null,
      },
      { userId: undefined },
    ])('should fail when user id parameter is $userId', async ({ userId }) => {
      await userService.create(usersData[0]);
      await userService.create(usersData[1]);
      await userService.create(usersData[2]);
      async function fn() {
        await userService.findForId(userId);
      }
      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow('User id required');
    });
  });

  describe('update', () => {
    it('shoud update user', async () => {
      await testUpdateUser(userRepo, (userId, updateData) =>
        userService.update(userId, updateData),
      );
    });

    it('should fail when user does not exists', async () => {
      const newName = 'New Name';
      const newEmail = 'newname@email.com';
      await userService.create(usersData[0]);
      await userService.create(usersData[1]);
      await userService.create(usersData[2]);
      async function fn() {
        await userService.update(12, { name: newName, email: newEmail });
      }
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow('User not found');
    });

    describe('id', () => {
      it.each([{ userId: null }, { userId: undefined }])(
        'should fail when user id is $userId',
        async ({ userId }) => {
          await userService.create(usersData[0]);
          await userService.create(usersData[1]);
          await userService.create(usersData[2]);
          async function fn() {
            await userService.findForId(userId);
          }
          await expect(fn()).rejects.toThrow(BadRequestException);
          await expect(fn()).rejects.toThrow('User id required');
        },
      );
    });
  });
});
