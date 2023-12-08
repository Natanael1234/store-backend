import { BadRequestException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testValidateCategories } from '../../../../../../../test/category/test-category-utils';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService.create (main)', () => {
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

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  it('should create categories', async () => {
    const c1 = await categoryService.create({
      name: 'Category 1',
      active: true,
    });
    const c2 = await categoryService.create({
      name: 'Category 2',
      active: true,
    });
    const c3 = await categoryService.create({
      name: 'Category 3',
      active: true,
      parentId: c1.id,
    });
    const c4 = await categoryService.create({
      name: 'Category 4',
      active: true,
      parentId: c1.id,
    });
    const c5 = await categoryService.create({
      name: 'Category 5',
      active: true,
      parentId: c3.id,
    });
    const createdCategories = [c1, c2, c3, c4, c5];
    const expectedCategories = [
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      {
        name: 'Category 3',
        active: true,
        parent: { id: c1.id, name: 'Category 1', active: true },
      },
      {
        name: 'Category 4',
        active: true,
        parent: { id: c1.id, name: 'Category 1', active: true },
      },
      {
        name: 'Category 5',
        active: true,
        parent: { id: c3.id, name: 'Category 3', active: true },
      },
    ];
    testValidateCategories(createdCategories, expectedCategories);
    const repositoryCategory = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .orderBy(CategoryConstants.CATEGORY_NAME, SortConstants.ASC)
      .getMany();
    testValidateCategories(repositoryCategory, expectedCategories);
  });

  it('should fail when category data is null', async () => {
    const fn = () => categoryService.create(null);
    await expect(fn()).rejects.toThrow(CategoryMessage.DATA_REQUIRED);
    await expect(fn()).rejects.toThrow(BadRequestException);
  });

  it('should fail when user data is undefined', async () => {
    const fn = () => categoryService.create(undefined);
    await expect(fn()).rejects.toThrow(CategoryMessage.DATA_REQUIRED);
    await expect(fn()).rejects.toThrow(BadRequestException);
  });
});
