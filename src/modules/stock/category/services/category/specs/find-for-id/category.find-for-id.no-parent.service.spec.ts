import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testInsertCategories } from '../../../../../../../test/category/test-category-utils';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

1;
describe('CategoryService.findForId (no parent)', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryService = module.get<CategoryService>(CategoryService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function createTestScenario() {
    const [categoryId1, categoryId2] = await testInsertCategories(
      categoryRepo,
      [
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: false },
      ],
    );
    return [categoryId1, categoryId2];
  }

  async function getCategories() {
    return categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
  }

  it('should retrieve category without parent when parent is null and publicAccess = true', async () => {
    const [categoryId1, categoryId2] = await createTestScenario();
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1, true);
    expect(response).toEqual({ ...categoriesBefore[0], parent: null });
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should retrieve category without parent when parent is null and publicAccess = false', async () => {
    const [categoryId1, categoryId2] = await createTestScenario();
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1, false);
    expect(response).toEqual(categoriesBefore[0]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should retrieve category without parent when parent is null and publicAccess = null', async () => {
    const [categoryId1, categoryId2] = await createTestScenario();
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1, null);
    expect(response).toEqual(categoriesBefore[0]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should retrieve category without parent when parent is null and publicAccess = undefined', async () => {
    const [categoryId1, categoryId2] = await createTestScenario();
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1, undefined);
    expect(response).toEqual(categoriesBefore[0]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });

  it('should retrieve category without parent when parent is null and publicAccess is not defined', async () => {
    const [categoryId1, categoryId2] = await createTestScenario();
    const categoriesBefore = await getCategories();
    const response = await categoryService.findById(categoryId1);
    expect(response).toEqual(categoriesBefore[0]);
    expect(await getCategories()).toEqual(categoriesBefore);
  });
});
