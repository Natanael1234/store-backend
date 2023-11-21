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
import { PasswordMessage } from '../../../src/modules/system/messages/password/password.messages.enum';
import { TextMessage } from '../../../src/modules/system/messages/text/text.messages';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { RoleMessage } from '../../../src/modules/user/enums/messages/role/role.messages.enum';
import { User } from '../../../src/modules/user/models/user/user.entity';
import {
  testValidateUsers,
  testValidateUsersWithPassword,
} from '../../../src/test/user/test-user-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - post /users (main)', () => {
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

  it('should create users', async () => {
    const createdUsers = [
      await testPostMin(
        app,
        '/users',
        {
          name: 'User 4',
          email: 'user4@email.com',
          password: 'Abc12*',
          roles: [Role.ROOT],
          active: true,
        },
        rootToken,
        HttpStatus.CREATED,
      ),
      await testPostMin(
        app,
        '/users',
        {
          name: 'User 5',
          email: 'user5@email.com',
          password: 'Xyz12*',
          roles: [Role.ADMIN],
          active: false,
        },
        rootToken,
        HttpStatus.CREATED,
      ),
      await testPostMin(
        app,
        '/users',
        {
          name: 'User 6',
          email: 'user6@email.com',
          password: 'Cba12*',
          roles: [Role.USER],
        },
        rootToken,
        HttpStatus.CREATED,
      ),
    ];

    const expectedData = [
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
        roles: [Role.ADMIN],
        active: false,
      },
      {
        name: 'User 6',
        email: 'user6@email.com',
        password: 'Cba12*',
        roles: [Role.USER],
        active: false,
      },
    ];
    testValidateUsers(createdUsers, expectedData);
    const users = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .skip(3)
      .getMany();
    await testValidateUsersWithPassword(users, expectedData, encryptionService);
  });

  it('should fail when user data has multiple errors', async () => {
    const NameMessage = new TextMessage('name', {
      minLength: UserConfigs.NAME_MIN_LENGTH,
      maxLength: UserConfigs.NAME_MAX_LENGTH,
    });
    const EmailMessage = new TextMessage('email', {
      maxLength: UserConfigs.EMAIL_MAX_LENGTH,
    });
    const ActiveMessage = new BoolMessage('active');
    const response = await testPostMin(
      app,
      '/users',
      {
        name: null,
        email: 'invalid',
        password: 'abcdef',
        roles: null,
        active: 1,
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: {
        name: NameMessage.NULL,
        email: EmailMessage.INVALID,
        active: ActiveMessage.INVALID,
        roles: RoleMessage.REQUIRED,
        password: PasswordMessage.INVALID,
      },
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
    });
  });
});
