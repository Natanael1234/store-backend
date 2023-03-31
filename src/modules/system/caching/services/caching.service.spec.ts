import { Test, TestingModule } from '@nestjs/testing';
import { CachingService } from './caching.service';

// TODO:
describe('CachingService', () => {
  let service: CachingService;
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [CachingService],
    }).compile();

    service = module.get<CachingService>(CachingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
