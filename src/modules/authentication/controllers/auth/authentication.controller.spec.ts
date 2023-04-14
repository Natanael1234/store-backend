import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { AuthenticationController } from './authentication.controller';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await getTestingModule();
    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
