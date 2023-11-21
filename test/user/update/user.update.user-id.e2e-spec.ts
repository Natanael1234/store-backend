import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../src/modules/system/messages/uuid/uuid.messages';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { UserMessage } from '../../../src/modules/user/enums/messages/user/user.messages.enum';
import { User } from '../../../src/modules/user/models/user/user.entity';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../utils/test-end-to-end.utils';
const UserIdMessage = new UuidMessage('user id');

describe('UserController (e2e) - patch /users/:userId (userId)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userRepo: Repository<User>;
  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
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

  it(`should reject when userId is invalid string`, async () => {
    const response = await testPatchMin(
      app,
      `/users/not-a-valid-uuid`,
      { name: 'New Name' },
      rootToken,
      HttpStatus.BAD_REQUEST,
    );
    expect(response).toEqual({
      error: ExceptionText.BAD_REQUEST,
      message: UserIdMessage.INVALID,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it(`should reject when userId is not found`, async () => {
    const usersBefore = await getUsers();
    const response = await testPatchMin(
      app,
      '/users/f136f640-90b7-11ed-a2a0-fd911f8f7f38',
      { name: 'New Name' },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: UserMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    expect(await getUsers()).toEqual(usersBefore);
  });
});
