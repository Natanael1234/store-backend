import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testInsertCategories } from '../../../../../../../test/category/test-category-utils';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

1;
describe('CategoryService.findForId (parent.deleted)', () => {
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
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await testInsertCategories(categoryRepo, [
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, deletedAt: new Date() },
        { name: 'Category 3', active: true, parentPosition: 1 },
        { name: 'Category 4', active: true, parentPosition: 2 },
      ]);
    return [categoryId1, categoryId2, categoryId3, categoryId4];
  }

  async function getCategories() {
    return categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .withDeleted()
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
  }

  describe('not deleted parent', () => {
    it('should retrieve category and its not deleted parent when publicAccess = true', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId3, true);
      expect(response).toEqual(categoriesBefore[2]);
      expect(await getCategories()).toEqual(categoriesBefore);
    });

    it('should retrieve category and its not deleted parent when publicAccess = false', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId3, false);
      expect(response).toEqual(categoriesBefore[2]);
      expect(await getCategories()).toEqual(categoriesBefore);
    });

    it('should retrieve category and its not deleted parent when publicAccess = null', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId3, false);
      expect(response).toEqual(categoriesBefore[2]);
      expect(await getCategories()).toEqual(categoriesBefore);
    });

    it('should retrieve category and its not deleted parent when publicAccess = undefined', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId3, undefined);
      expect(response).toEqual(categoriesBefore[2]);
      expect(await getCategories()).toEqual(categoriesBefore);
    });

    it('should retrieve category and its not deleted parent when publicAccess is not defined', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId3);
      expect(response).toEqual(categoriesBefore[2]);
      expect(await getCategories()).toEqual(categoriesBefore);
    });
  });

  describe('deleted parent', () => {
    it('should retrieve category without its deleted parent when publicAccess = true', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId4, true);
      expect(response).toEqual({ ...categoriesBefore[3], parent: null });
      expect(await getCategories()).toEqual(categoriesBefore);
    });

    it('should retrieve category and its deleted parent when publicAccess = false', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId4, false);
      expect(response).toEqual(categoriesBefore[3]);
      expect(await getCategories()).toEqual(categoriesBefore);
    });

    it('should retrieve category and its deleted parent when publicAccess = null', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId4, null);
      expect(response).toEqual(categoriesBefore[3]);
      expect(await getCategories()).toEqual(categoriesBefore);
    });

    it('should retrieve category and its deleted parent when publicAccess = undefined', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId4, undefined);
      expect(response).toEqual(categoriesBefore[3]);
      expect(await getCategories()).toEqual(categoriesBefore);
    });

    it('should retrieve category and its deleted parent when publicAccess is not defined', async () => {
      const [categoryId1, categoryId2, categoryId3, categoryId4] =
        await createTestScenario();
      const categoriesBefore = await getCategories();
      const response = await categoryService.findById(categoryId4);
      expect(response).toEqual(categoriesBefore[3]);
      expect(await getCategories()).toEqual(categoriesBefore);
    });
  });
});
