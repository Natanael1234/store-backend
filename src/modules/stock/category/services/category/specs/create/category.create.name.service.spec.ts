import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestCategoryInsertParams,
  testInsertCategories,
  testValidateCategories,
  testValidateCategory,
} from '../../../../../../../test/category/test-category-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { CategoryConfigs } from '../../../../configs/category/category.configs';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService.create (name)', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  const NameMessage = new TextMessage('name', {
    minLength: CategoryConfigs.NAME_MIN_LENGTH,
    maxLength: CategoryConfigs.NAME_MAX_LENGTH,
  });

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

  it('should accept when name has minimum allowed length', async () => {
    const name = 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH);
    const created = await categoryService.create({ name });
    const expectedResults = [{ name, active: false }];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should accept when name has maximum allowed length', async () => {
    const name = 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH);
    const data = { name };
    const created = await categoryService.create(data);
    const expectedResults = [{ name, active: false }];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should reject when name is shorter than allowed', async () => {
    const fn = () =>
      categoryService.create({
        name: 'x'.repeat(
          CategoryConfigs.NAME_MIN_LENGTH - 1,
        ) as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.MIN_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is longer then allowed', async () => {
    const fn = () =>
      categoryService.create({
        name: 'x'.repeat(
          CategoryConfigs.NAME_MAX_LENGTH + 1,
        ) as unknown as string,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.MAX_LEN },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is null', async () => {
    const fn = () =>
      categoryService.create({ name: null as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is undefined', async () => {
    const fn = () => categoryService.create({ name: undefined });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is number', async () => {
    const fn = () =>
      categoryService.create({ name: 2323232 as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is boolean', async () => {
    const fn = () =>
      categoryService.create({ name: true as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is array', async () => {
    const fn = () => categoryService.create({ name: [] as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when name is object', async () => {
    const fn = () => categoryService.create({ name: {} as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { name: NameMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
