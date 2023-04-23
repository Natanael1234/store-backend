import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { CachingService } from './caching.service';

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

  it.skip('should be defined', () => {
    expect(service).toBeDefined();
  });
});
