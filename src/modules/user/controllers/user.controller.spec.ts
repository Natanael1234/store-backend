import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../.jest/test-config.module';
import { UserController } from './user.controller';

describe('UserController', () => {
  let module: TestingModule;
  let userController: UserController;

  beforeEach(async () => {
    module = await getTestingModule();
    userController = module.get<UserController>(UserController);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('sould be defined', async () => {
    expect(userController).toBeDefined();
  });
});
