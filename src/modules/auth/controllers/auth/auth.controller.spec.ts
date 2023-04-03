import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { getTestingModule } from '../../../../.jest/test-config.module';

describe('AuthController', () => {
  let controller: AuthController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await getTestingModule({
      controllers: [AuthController],
    });

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
