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

const EmailMessage = new TextMessage('email', {
  maxLength: UserConfigs.EMAIL_MAX_LENGTH,
});

describe('UserController (e2e) - patch /users/:userId (email)', () => {
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
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .skip(3)
      .getMany();
  }

  async function insertUsers(
    ...users: TestUserInsertParams[]
  ): Promise<string[]> {
    return testInsertUsers(userRepo, encryptionService, users);
  }

  it('should accept when email has valid format', async () => {
    const [userId4, userId5] = await insertUsers(
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
    );
    const newEmail = `user4@email.com`;
    const expectedResults = [
      {
        name: 'User 4',
        email: newEmail,
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
    const ret = await testPatchMin(
      app,
      `/users/${userId4}`,
      { email: newEmail },
      rootToken,
      HttpStatus.OK,
    );
    testValidateUser(ret, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when email has max allowed length', async () => {
    const [userId4, userId5] = await insertUsers(
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
    );

    const newEmail = `user1${'b'.repeat(
      UserConfigs.EMAIL_MAX_LENGTH - 10,
    )}@e.co`;
    const expectedResults = [
      {
        name: 'User 4',
        email: newEmail,
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
    const ret = await testPatchMin(
      app,
      `/users/${userId4}`,
      { email: newEmail },
      rootToken,
      HttpStatus.OK,
    );
    testValidateUser(ret, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when email is undefined', async () => {
    const [userId4, userId5] = await insertUsers(
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
    );
    const ret = await testPatchMin(
      app,
      `/users/${userId4}`,
      { email: undefined },
      rootToken,
      HttpStatus.OK,
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
    testValidateUser(ret, expectedResults[0]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should reject when email has invalid format', async () => {
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
      { email: 'invalid' },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when email is longer than allowed', async () => {
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
        email: `user4${'b'.repeat(UserConfigs.EMAIL_MAX_LENGTH - 10 + 1)}@e.co`,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.MAX_LEN },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when email is null', async () => {
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
      { email: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when email is number', async () => {
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
      { email: 1 as unknown as string },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when email is boolean', async () => {
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
      { email: true as unknown as string },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when email is array', async () => {
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
      { email: [] as unknown as string },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when email is {}', async () => {
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
      { email: {} as unknown as string },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { email: EmailMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when email is already in use', async () => {
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
      { email: 'user3@email.com' },
      rootToken,
      HttpStatus.CONFLICT,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.CONFLICT,
      message: EmailMessage.INVALID,
      statusCode: HttpStatus.CONFLICT,
    });
  });

  it.skip('should ivalidate refresh tokens if change email', async () => {});
});
