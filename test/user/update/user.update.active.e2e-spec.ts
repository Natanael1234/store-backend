import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { BoolMessage } from '../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
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
const ActiveMessage = new BoolMessage('active');

describe('UserController (e2e) - patch /users/:userId (active)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = moduleFixture.get<EncryptionService>(EncryptionService);
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
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

  it('should accept when active is true', async () => {
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
        active: false,
      },
      {
        name: 'User 6',
        email: 'user6@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: true,
      },
    ];
    const ret = await testPatchMin(
      app,
      `/users/${userId5}`,
      {
        name: 'User 6',
        email: 'user6@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      },
      rootToken,
      HttpStatus.OK,
    );
    testValidateUser(ret, expectedResults[1]);
    const users = await getUsers();
    await testValidateUsersWithPassword(
      users,
      expectedResults,
      encryptionService,
    );
  });

  it('should accept when active is false', async () => {
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
        active: true,
      },
    );
    const expectedResults = [
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
        active: true,
      },
    ];
    const ret = await testPatchMin(
      app,
      `/users/${userId4}`,
      { active: false },
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

  it('should accept when active is undefined', async () => {
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
        active: true,
      },
    );
    const expectedResults = [
      {
        name: 'User 4b',
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
        active: true,
      },
    ];
    const ret = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: 'User 4b', active: undefined },
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

  it('should reject when active is null', async () => {
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
        active: true,
      },
    );

    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: 'User 4b', email: 'user@email.com', active: null },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.NULL },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is number', async () => {
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
        active: true,
      },
    );
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: 'User 4b', active: 1 as unknown as boolean },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is string', async () => {
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
        active: true,
      },
    );
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: 'User 4b', active: 'true' as unknown as boolean },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is array', async () => {
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
        active: true,
      },
    );
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: 'User 4b', active: [] as unknown as boolean },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('should reject when active is object', async () => {
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
        active: true,
      },
    );
    const brandsBefore = await getUsers();
    const response = await testPatchMin(
      app,
      `/users/${userId4}`,
      { name: 'User 4b', active: {} as unknown as boolean },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const brandsAfter = await getUsers();
    expect(brandsBefore).toStrictEqual(brandsAfter);
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
