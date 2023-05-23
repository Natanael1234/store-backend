import { getTestingModule } from '../../../../.jest/test-config.module';
import { CategoryController } from './category.controller';

describe('CategoryController', () => {
  let controller: CategoryController;

  beforeEach(async () => {
    const module = await getTestingModule();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
