import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
  testValidateCategory,
} from '../../../../../../../test/category/test-category-utils';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryConstants } from '../../../../constants/category/categoryd-entity.constants';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

describe('CategoryService.findForId (main)', () => {
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

  async function insertCategories(
    ...categories: TestCategoryInsertParams[]
  ): Promise<string[]> {
    return testInsertCategories(categoryRepo, categories);
  }

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  it('should find category for id', async () => {
    const [categoryId1, categoryId2, categoryId3] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3' },
    );
    const response = await categoryService.findById(categoryId2);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true },
      { name: 'Category 3', active: false },
    ]);
    testValidateCategory(response, { name: 'Category 2', active: true });
  });

  it('should reject with multiple errors', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const fn = () =>
      categoryService.findById(categoryId1, {
        active: 1 as unknown as ActiveFilter,
        deleted: 'invalid' as unknown as DeletedFilter,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categories = await categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .orderBy(CategoryConstants.CATEGORY_NAME)
      .getMany();
    testValidateCategories(categories, [{ name: 'Category 1', active: true }]);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          active: ActiveMessage.INVALID,
          deleted: DeletedMessage.INVALID,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
