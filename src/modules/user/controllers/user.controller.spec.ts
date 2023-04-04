import { TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { getTestingModule } from '../../../.jest/test-config.module';

import { Repository } from 'typeorm';
import { UserEntity } from '../models/user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  testCreateUser,
  testFindUserForId,
  testFindUsers,
  testUpdateUser,
} from '../test-user-utils';

describe('UserController', () => {
  let module: TestingModule;
  let userController: UserController;
  let userRepo: Repository<UserEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    userController = module.get<UserController>(UserController);
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('insert', () => {
    it('should create users', async () => {
      await testCreateUser(userRepo, (userData: any) =>
        userController.create(userData),
      );
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      await testUpdateUser(userRepo, (userId: number, userData: any) =>
        userController.update({ userId }, userData),
      );
    });
  });

  describe('find all', () => {
    it('should all users', async () => {
      await testFindUsers(userRepo, () => userController.findAll());
    });
  });

  describe('find one', () => {
    it('should find one user', async () => {
      await testFindUserForId(userRepo, (userId: number) =>
        userController.findForId({ userId }),
      );
    });
  });
});
