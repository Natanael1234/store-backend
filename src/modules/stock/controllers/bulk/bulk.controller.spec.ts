import { getTestingModule } from '../../../../.jest/test-config.module';
import { BulkController } from './bulk.controller';

describe.skip('BulkController', () => {
  let controller: BulkController;

  beforeEach(async () => {
    const module = await getTestingModule();

    controller = module.get<BulkController>(BulkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
