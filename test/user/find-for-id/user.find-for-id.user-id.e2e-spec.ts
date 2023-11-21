import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../src/modules/system/messages/uuid/uuid.messages';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { UserMessage } from '../../../src/modules/user/enums/messages/user/user.messages.enum';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { testValidateUser } from '../../../src/test/user/test-user-utils';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../utils/test-end-to-end.utils';

const UserIdMessage = new UuidMessage('user id');

describe('UserController (e2e) - delete /users/:userId (userId)', () => {
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

  // TODO: replace all ocurrences with reusable code?
  async function insertUsers(
    ...users: {
      name: string;
      email: string;
      password: string;
      active?: boolean;
      roles: Role[];
    }[]
  ): Promise<string[]> {
    const ids = [];
    for (const user of users) {
      const ret = await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          name: user.name,
          email: user.email,
          hash: await encryptionService.encrypt(user.password),
          roles: user.roles,
          active: user.active,
        })
        .execute();
      ids.push(ret.identifiers[0].id);
    }
    return ids;
  }

  async function getUsers() {
    return await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .skip(3)
      .getMany();
  }

  it('should get a user by id', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: true,
    });
    const usersBefore = await getUsers();
    const response = await testGetMin(
      app,
      `/users/${userId4}`,
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
    expect(await getUsers()).toEqual(usersBefore);
    testValidateUser(response, {
      name: 'User 4',
      email: 'user4@email.com',
      roles: [Role.ROOT],
      active: true,
    });
  });

  it('should fail when user is not found', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: true,
    });
    const usersBefore = await getUsers();
    const response = await testGetMin(
      app,
      `/users/550e8400-e29b-41d4-a716-446655440000`,
      { query: '{}' },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: UserMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it('should fail when user id parameter is invalid', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: true,
    });
    const usersBefore = await getUsers();
    expect(await getUsers()).toEqual(usersBefore);
    const response = await testGetMin(
      app,
      '/users/not-a-valid-uuid',
      { query: '{}' },
      rootToken,
      HttpStatus.BAD_REQUEST,
    );
    expect(response).toEqual({
      error: ExceptionText.BAD_REQUEST,
      message: UserIdMessage.INVALID,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });
});
