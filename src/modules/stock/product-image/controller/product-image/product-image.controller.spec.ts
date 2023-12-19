import { getTestingModule } from '../../../../../.jest/test-config.module';
import { ProductImageController } from './product-image.controller';

describe('ProductImageController', () => {
  let controller: ProductImageController;

  beforeEach(async () => {
    const module = await getTestingModule();
    controller = module.get<ProductImageController>(ProductImageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
