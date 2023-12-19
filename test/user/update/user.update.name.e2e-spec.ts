import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessage } from '../../../src/modules/system/messages/text/text.messages';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { User } from '../../../src/modules/user/models/user/user.entity';
import {
  TestUserInsertParams,
  testInsertUsers,
  testValidateUser,
  testValidateUsersWithPassword,
} from '../../../src/test/user/test-user-utils';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../utils/test-end-to-end.utils';

const { NAME_MAX_LENGTH, NAME_MIN_LENGTH } = UserConfigs;

const NameMessage = new TextMessage('name', {
  minLength: NAME_MIN_LENGTH,
  maxLength: NAME_MAX_LENGTH,
});

describe('UserController (e2e) - patch /users/:userId (name)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;
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
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = module.get<EncryptionService>(EncryptionService);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function getUsers() {
    return await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .orderBy(UserConstants.USER_EMAIL, SortConstants.ASC)
      .skip(3)
      .getMany();
  }

  async function insertUsers(
    ...users: TestUserInsertParams[]
  ): Promise<string[]> {
    return testInsertUsers(userRepo, encryptionService, users);
  }

  it('should accept when name has min allowed length', async () => {
    const [userId4, userId5] = await insertUsers(
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: false,
      },
      {
        name: 'User 5',
        email: 'user5@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    );
    const newName = 'a'.repeat(NAME_MIN_LENGTH);
    const expectedResults = [
      {
        name: newName,
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 5',
        email: 'user5@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    ];
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      {
        name: newName,
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.OK,
    );
    // TODO: usar validação de senha (testValidateUsersWithPassword)
    testValidateUser(response, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when name has max allowed length', async () => {
    const [userId4, userId5] = await insertUsers(
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: false,
      },
      {
        name: 'User 5',
        email: 'user5@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    );
    const newName = 'a'.repeat(NAME_MAX_LENGTH);
    const expectedResults = [
      {
        name: newName,
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 5',
        email: 'user5@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    ];
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      {
        name: newName,
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.OK,
    );
    testValidateUser(response, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when name is undefined', async () => {
    const [userId4, userId5] = await insertUsers(
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: false,
      },
      {
        name: 'User 5',
        email: 'user5@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    );
    const expectedResults = [
      {
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 5',
        email: 'user5@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
    ];
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      {
        name: undefined,
        email: 'user4@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.OK,
    );
    testValidateUser(response, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should reject when name as shorter than allowed', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: 'x'.repeat(NAME_MIN_LENGTH - 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MIN_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name as longer than allowed', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: 'x'.repeat(NAME_MAX_LENGTH + 1) },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is null', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is number', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: 1 as unknown as string },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is boolean', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      {
        name: true as unknown as string,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is array', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: [] as unknown as string },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when name is {}', async () => {
    const [userId4, user2] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: false,
    });
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: {} as unknown as string },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { name: NameMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
