import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { getTestingModule } from '../../../.jest/test-config.module';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await getTestingModule({
      controllers: [UserController],
    });

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
