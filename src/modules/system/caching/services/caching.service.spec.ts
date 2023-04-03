import { Test, TestingModule } from '@nestjs/testing';
import { CachingService } from './caching.service';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { CacheModule } from '@nestjs/common';

// TODO:
describe('CachingService', () => {
  let service: CachingService;
  let module: TestingModule;
  beforeEach(async () => {
    module = await getTestingModule();
    service = module.get<CachingService>(CachingService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
