import { getTestingModule } from '../../../.jest/test-config.module';
import { StockController } from './stock.controller';

describe('StockController', () => {
  let controller: StockController;

  beforeEach(async () => {
    const module = await getTestingModule();
    controller = module.get<StockController>(StockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
