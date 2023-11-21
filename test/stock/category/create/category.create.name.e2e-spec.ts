import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryConfigs } from '../../../../src/modules/stock/category/configs/category/category.configs';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../src/modules/system/messages/text/text.messages';
import {
  testValidateCategories,
  testValidateCategory,
} from '../../../../src/test/category/test-category-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

const NameMessage = new TextMessage('name', {
  minLength: CategoryConfigs.NAME_MIN_LENGTH,
  maxLength: CategoryConfigs.NAME_MAX_LENGTH,
});

describe('CategoryController (e2e) - post /categories (name)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let categoryRepo: CategoryRepository;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    categoryRepo = moduleFixture.get<CategoryRepository>(CategoryRepository);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
  });

  it('should accept when name has minimum allowed length', async () => {
    const name = 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH);
    const created = await testPostMin(
      app,
      '/categories',
      { name },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [{ name, active: false }];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should accept when name has maximum allowed length', async () => {
    const name = 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH);
    const created = await testPostMin(
      app,
      '/categories',
      { name },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [{ name, active: false }];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should reject when name is shorter than allowed', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH - 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MIN_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is longer then allowed', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH + 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is null', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is undefined', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: undefined },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.REQUIRED },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is number', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: 2323232 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is boolean', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: true },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is array', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is object', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
