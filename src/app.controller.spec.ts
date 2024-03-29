import { TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { getTestingModule } from './.jest/test-config.module';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await getTestingModule();
    appController = app.get<AppController>(AppController);
  });

  // TODO after each close app

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
