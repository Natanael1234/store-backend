import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  testValidateCategories,
  testValidateCategory,
} from '../../../../../../../test/category/test-category-utils';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CategoryService } from '../../category.service';

describe('CategoryService.create (active)', () => {
  let categoryService: CategoryService;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;

  const ActiveMessage = new BoolMessage('active');

  beforeEach(async () => {
    module = await getTestingModule();
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    categoryService = module.get<CategoryService>(CategoryService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should accept when active is true', async () => {
    const created = await categoryService.create({
      active: true,
      name: 'Category 1',
    });
    const expectedResults = [
      { active: true, name: 'Category 1', parent: null },
    ];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should accept when active is false', async () => {
    const created = await categoryService.create({
      active: false,
      name: 'Category 1',
    });
    const expectedResults = [
      { active: false, name: 'Category 1', parent: null },
    ];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should accept when active is undefined', async () => {
    const created = await categoryService.create({
      active: undefined,
      name: 'Category 1',
    });
    const expectedResults = [
      { active: false, name: 'Category 1', parent: null },
    ];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should reject when active is null', async () => {
    const fn = () =>
      categoryService.create({ name: 'Category 1', active: null });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is number', async () => {
    const fn = () =>
      categoryService.create({
        name: 'Category 1',
        active: 1 as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is string', async () => {
    const fn = () =>
      categoryService.create({
        name: 'Category 1',
        active: 'true' as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is array', async () => {
    const fn = () =>
      categoryService.create({
        name: 'Category 1',
        active: [] as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is object', async () => {
    const fn = () =>
      categoryService.create({
        name: 'Category 1',
        active: {} as unknown as boolean,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await categoryRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
