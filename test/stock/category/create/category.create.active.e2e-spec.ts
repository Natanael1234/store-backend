import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../../src/modules/system/messages/text/text.messages';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  testValidateCategories,
  testValidateCategory,
} from '../../../../src/test/category/test-category-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

const NameMessage = new TextMessage('name');
const ActiveMessage = new BoolMessage('active');
const ParendtIdMessage = new UuidMessage('parent id');

describe('CategoryController (e2e) - post /categories (active)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let categoryRepo: CategoryRepository;
  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should accept when active is true', async () => {
    const created = await testPostMin(
      app,
      '/categories',
      {
        active: true,
        name: 'Category 1',
      },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [
      { active: true, name: 'Category 1', parent: null },
    ];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should accept when active is false', async () => {
    const created = await testPostMin(
      app,
      '/categories',
      { active: false, name: 'Category 1' },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [
      { active: false, name: 'Category 1', parent: null },
    ];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should accept when active is undefined', async () => {
    const created = await testPostMin(
      app,
      '/categories',
      { active: undefined, name: 'Category 1' },
      rootToken,
      HttpStatus.CREATED,
    );
    const expectedResults = [
      { active: false, name: 'Category 1', parent: null },
    ];
    testValidateCategory(created, expectedResults[0]);
    const registers = await categoryRepo.find({ relations: { parent: true } });
    testValidateCategories(registers, expectedResults);
  });

  it('should reject when active is null', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'Category 1', active: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is number', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'Category 1', active: 1 },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is string', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'Category 1', active: 'true' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is array', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'Category 1', active: [] },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is object', async () => {
    const response = await testPostMin(
      app,
      '/categories',
      { name: 'Category 1', active: {} },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await categoryRepo.count()).toEqual(0);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
