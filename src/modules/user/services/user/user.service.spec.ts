import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from '../../models/user/user.entity';
import { UserService } from './user.service';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { CreateUserDTO } from '../../dtos/create-user/create-user.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let module: TestingModule;
  let service: UserService;
  let repo: Repository<UserEntity>;

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
  const userArray = [userDto1, userDto2, userDto3];

  beforeEach(async () => {
    module = await getTestingModule();
    service = module.get<UserService>(UserService);
    repo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create users', async () => {
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);

      const users = await repo.find();

      expect(Array.isArray(users)).toBe(true);
      expect(users).toHaveLength(3);

      for (let i = 0, p = 1; i < 3; i++, p++) {
        expect(users[i]).toBeInstanceOf(UserEntity);
        expect(users[i].id).toEqual(p);
        expect(users[i].name).toEqual(userArray[i].name);
        expect(users[i].email).toEqual(userArray[i].email);
        expect(users[i].hash).toBeUndefined();
        expect(users[i].created).toBeDefined();
        expect(users[i].updated).toBeDefined();
        expect(users[i].deletedAt).toBeNull();
      }
    });

    it('should throw error when passing null dto', async () => {
      async function fn() {
        await service.create(null);
      }
      await expect(fn()).rejects.toThrow(QueryFailedError);
      await expect(fn()).rejects.toThrow('Undefined user data');
    });

    it('should throw error when passing an undefined dto', async () => {
      async function fn() {
        await service.create(undefined);
      }
      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow('Undefined user data');
    });

    it('should throw error when passing a null email', async () => {
      async function fn() {
        const userDto: CreateUserDTO = {
          name: 'User 3',
          email: null,
          password: '12345',
          acceptTerms: true,
        };
        await service.create(userDto);
      }

      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow('Undefined user data').catch();
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
        expect(users[i].name).toEqual(userArray[i].name);
        expect(users[i].email).toEqual(userArray[i].email);
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

    it('should throw error when user is not found', async () => {
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);
      async function fn() {
        await service.findForId(10);
      }
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow('User not found');
    });

    it('should throw error when user id parameter is null', async () => {
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);
      async function fn() {
        await service.findForId(null);
      }
      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow('User id not defined');
    });

    it('should throw error when user id parameter is undefined', async () => {
      await service.create(userDto1);
      await service.create(userDto2);
      await service.create(userDto3);
      async function fn() {
        await service.findForId(undefined);
      }
      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow('User id not defined');
    });
  });
});
