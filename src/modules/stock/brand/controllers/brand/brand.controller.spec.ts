import { getTestingModule } from '../../../../../.jest/test-config.module';
import { BrandController } from './brand.controller';

describe('BrandController', () => {
  let controller: BrandController;

  beforeEach(async () => {
    const module = await getTestingModule();

    controller = module.get<BrandController>(BrandController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
