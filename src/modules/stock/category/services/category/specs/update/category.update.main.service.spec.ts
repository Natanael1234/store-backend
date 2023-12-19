import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
  testValidateCategory,
} from '../../../../../../../test/category/test-category-utils';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const NameMessage = new TextMessage('name', {
  minLength: CategoryConfigs.NAME_MIN_LENGTH,
  maxLength: CategoryConfigs.NAME_MAX_LENGTH,
});
const ActiveMessage = new BoolMessage('active');
const ParentIdMessage = new UuidMessage('parent id');

describe('CategoryService.update (main)', () => {
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  let categoryService: CategoryService;

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryService = module.get<CategoryService>(CategoryService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function insertCategories(...categories: TestCategoryInsertParams[]) {
    return testInsertCategories(categoryRepo, categories);
  }

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  it('should update category', async () => {
    const [categoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: true, parentPosition: 1 },
    );

    const categoryId = categoryId3;

    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true },
      { id: categoryId2, name: 'Category 2', active: true },
      {
        id: categoryId3,
        name: 'New Name',
        active: false,
        parent: { id: categoryId2, name: 'Category 2', active: true },
      },
    ];
    const updatedCategory = await categoryService.update(categoryId, {
      name: 'New Name',
      active: false,
      parentId: categoryId2,
    });
    expect(updatedCategory).toBeDefined();

    testValidateCategory(updatedCategory, expectedResults[2]);
    const categoriesAfter = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .getMany();
    testValidateCategories(categoriesAfter, expectedResults);
  });

  it('should reject with multiple errors', async () => {
    const [categoriesId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.update(categoriesId1, {
        name: 1 as unknown as string,
        active: '1' as unknown as boolean,
        parentId: 1 as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          name: NameMessage.INVALID,
          active: ActiveMessage.INVALID,
          parentId: ParentIdMessage.STRING,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
