import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../.jest/test-config.module';
import { UserController } from './user.controller';

import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../models/user/user.entity';

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

  it('sould be defined', async () => {
    expect(userController).toBeDefined();
  });
});
