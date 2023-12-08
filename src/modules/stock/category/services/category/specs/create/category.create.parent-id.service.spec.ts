import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
  testValidateCategory,
} from '../../../../../../../test/category/test-category-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { UuidListMessage } from '../../../../../../system/messages/uuid-list/uuid-list.messages';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryMessage } from '../../../../messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

const ParentIdMessage = new UuidListMessage('parent ids', {
  maxLength: CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH,
});

describe('CategoryService.create (parentId)', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;

  const ParentIdMessage = new UuidMessage('parent id');

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

  it(`should accept create when parentId is valid`, async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });

    const created = await categoryService.create({
      name: 'Category 2',
      active: false,
      parentId: categoryId1,
    });

    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true, parent: null },
      {
        id: created.id,
        name: 'Category 2',
        active: false,
        parent: {
          id: categoryId1,
          name: 'Category 1',
          active: true,
        },
      },
    ];
    testValidateCategory(created, expectedResults[1]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it(`should accept to create when parentId is null`, async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const created = await categoryService.create({
      name: 'Category 2',
      active: false,
      parentId: null,
    });
    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true, parent: null },
      { id: created.id, name: 'Category 2', active: false, parent: null },
    ];
    testValidateCategory(created, expectedResults[1]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it(`should accept to create when parentId is undefined`, async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const created = await categoryService.create({
      name: 'Category 2',
      active: false,
      parentId: undefined,
    });
    const expectedResults = [
      { id: categoryId1, name: 'Category 1', active: true, parent: null },
      { id: created.id, name: 'Category 2', active: false, parent: null },
    ];

    testValidateCategory(created, expectedResults[1]);
    const registers = await categoryRepo.find({
      relations: { parent: true },
    });
    testValidateCategories(registers, expectedResults);
  });

  it('should reject when parentId is number', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.create({
        name: 'New Category',
        active: true,
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
        message: { parentId: ParentIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentId is boolean', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.create({
        name: 'New Category',
        active: true,
        parentId: true as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentId: ParentIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentId is object', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.create({
        name: 'New Category',
        active: true,
        parentId: {} as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentId: ParentIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentId is invalid string', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.create({
        name: 'New Category',
        active: true,
        parentId: 'not-a-valid-uuid',
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentId: ParentIdMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when parentId is array', async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.create({
        name: 'New Category',
        active: true,
        parentId: [] as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { parentId: ParentIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it(`should reject create when parentId category is not found`, async () => {
    const [categoryId1] = await insertCategories({
      name: 'Category 1',
      active: true,
    });
    const categoriesBefore = await categoryRepo.find();
    const fn = () =>
      categoryService.create({
        name: 'Category 1',
        active: true,
        parentId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
      });
    await expect(fn()).rejects.toThrow(NotFoundException);
    const categoriesAfter = await categoryRepo.find();
    expect(categoriesBefore).toStrictEqual(categoriesAfter);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.PARENT_CATEGORY_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
  });

  it.skip('Should not create cycles in category hierarchy', () => {});
});
