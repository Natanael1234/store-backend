import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { getTestingModule } from '../../../.jest/test-config.module';

describe('UserController', () => {
  let controller: UserController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await getTestingModule({
      controllers: [UserController],
    });

    controller = module.get<UserController>(UserController);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
