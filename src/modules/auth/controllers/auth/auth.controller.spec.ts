import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { getTestingModule } from '../../../../.jest/test-config.module';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await getTestingModule({
      controllers: [AuthController],
    });

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
