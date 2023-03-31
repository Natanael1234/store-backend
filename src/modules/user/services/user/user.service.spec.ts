import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from '../../models/user/user.entity';
import { UserService } from './user.service';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { CreateUserDTO } from '../../dtos/create-user/create-user.dto';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('UserService', () => {
  let module: TestingModule;
  let service: UserService;
  let userRepo: Repository<UserEntity>;

  const userDto1: CreateUserDTO = {
    name: 'User 1',
    email: 'user1@email.com',
    password: '123',
    acceptTerms: true,
  };
  const userDto2: CreateUserDTO = {
    name: 'User 2',
    email: 'user2@email.com',
    password: '1234',
    acceptTerms: true,
  };
  const userDto3: CreateUserDTO = {
    name: 'User 3',
    email: 'user3@email.com',
    password: '12345',
    acceptTerms: true,
  };
  const userDtos = [userDto1, userDto2, userDto3];

  beforeEach(async () => {
    module = await getTestingModule();
    service = module.get<UserService>(UserService);
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('create', () => {
    it('should create users', async () => {
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);

      const users = await userRepo.find();

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(3);

      for (let i = 0, p = 1; i < 3; i++, p++) {
        expect(users[i]).toBeInstanceOf(UserEntity);
        expect(users[i].id).toEqual(p);
        expect(users[i].name).toEqual(userDtos[i].name);
        expect(users[i].email).toEqual(userDtos[i].email);
        expect(users[i].hash).toBeUndefined();
        expect(users[i].created).toBeDefined();
        expect(users[i].updated).toBeDefined();
        expect(users[i].deletedAt).toBeNull();
      }
    });

    it.each([{ user: null }, { user: undefined }])(
      'should fail when user data is $user',
      async ({ user }) => {
        async function fn() {
          await service.create(user);
        }
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
          service.create({
            name: 'User 3',
            email,
            password: '12345',
            acceptTerms: true,
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
          service.create({
            name,
            email: 'user@email.com',
            password: '12345',
            acceptTerms: true,
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
            service.create({
              name: 'User',
              email: 'user@email.com',
              password,
              acceptTerms: true,
            });

          await expect(fn()).rejects.toThrow('Password is required');
          await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        },
      );
    });
  });

  describe('find', () => {
    it('should return an empty array when no users are found', async () => {
      const users = await service.findAll();
      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(0);
    });

    it('should return an array of users', async () => {
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);
      const users = await service.findAll();

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(3);

      for (let i = 0, p = 1; i < 3; i++, p++) {
        expect(users[i]).toBeInstanceOf(UserEntity);
        expect(users[i].id).toEqual(p);
        expect(users[i].name).toEqual(userDtos[i].name);
        expect(users[i].email).toEqual(userDtos[i].email);
        expect(users[i].hash).toBeUndefined();
        expect(users[i].created).toBeDefined();
        expect(users[i].updated).toBeDefined();
        expect(users[i].deletedAt).toBeNull();
      }
    });
  });

  describe('findForId', () => {
    it('should get a single user', async () => {
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);
      const user = await service.findForId(2);
      expect(user).toBeDefined();
      expect(user).toBeInstanceOf(UserEntity);
      expect(user.id).toEqual(2);
      expect(user.hash).toBeUndefined();
      expect(user.name).toEqual(userDto2.name);
      expect(user.email).toEqual(userDto2.email);
      expect(user.created).toBeDefined();
      expect(user.updated).toBeDefined();
      expect(user.deletedAt).toBeNull();
    });

    it('should fail when user is not found', async () => {
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);
      async function fn() {
        await service.findForId(10);
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
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);
      async function fn() {
        await service.findForId(userId);
      }
      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow('User id required');
    });
  });

  function validateUser(user, validationData) {
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(UserEntity);
    expect(user.id).toEqual(validationData.id);
    expect(user.name).toEqual(validationData.name);
    expect(user.email).toEqual(validationData.email);
  }

  describe('update', () => {
    it('shoud update an user', async () => {
      const newName = 'New Name';
      const newEmail = 'newname@email.com';
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);

      // TODO: atualização de senha em métodos separados
      await service.update({
        id: 2,
        name: newName,
        email: newEmail,
      });

      const users = await userRepo.find();
      expect(users).toHaveLength(3);

      validateUser(users[0], {
        id: 1,
        name: userDtos[0].name,
        email: userDtos[0].email,
      });

      validateUser(users[1], {
        id: 2,
        name: newName,
        email: newEmail,
      });

      validateUser(users[2], {
        id: 3,
        name: userDtos[2].name,
        email: userDtos[2].email,
      });
    });

    it('should fail when user is not found', async () => {
      const newName = 'New Name';
      const newEmail = 'newname@email.com';
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);
      async function fn() {
        await service.update({
          id: 10,
          name: newName,
          email: newEmail,
        });
      }
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow('User not found');
    });

    describe('id', () => {
      it.each([{ userId: null }, { userId: undefined }])(
        'should fail when user id is $userId',
        async ({ userId }) => {
          await service.create(userDto1);
          await service.create(userDto2);
          await service.create(userDto3);
          async function fn() {
            await service.findForId(userId);
          }
          await expect(fn()).rejects.toThrow(BadRequestException);
          await expect(fn()).rejects.toThrow('User id required');
        },
      );
    });
  });
});
