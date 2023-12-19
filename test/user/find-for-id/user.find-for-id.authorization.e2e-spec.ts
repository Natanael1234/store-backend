import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { Role } from '../../../src/modules/authentication/enums/role/role.enum';
import { EncryptionService } from '../../../src/modules/system/encryption/services/encryption/encryption.service';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { User } from '../../../src/modules/user/models/user/user.entity';
import {
  TestUserInsertParams,
  testInsertUsers,
} from '../../../src/test/user/test-user-utils';
import {
  testBuildAuthenticationScenario,
  testPatchMin,
} from '../../utils/test-end-to-end.utils';

describe('UserController (e2e) - patch /users/:userId (authorization)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;
  let tokens: { rootToken: string; adminToken: string; userToken: string };

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
    tokens = await testBuildAuthenticationScenario(module);
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function insertUsers(
    ...users: TestUserInsertParams[]
  ): Promise<string[]> {
    return testInsertUsers(userRepo, encryptionService, users);
  }

  it('should not allow basic user', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: true,
    });
    await testPatchMin(
      app,
      `/users/${userId4}`,
      { password: 'Xyz*123' },
      tokens.userToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should not allow admin user', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: true,
    });
    await testPatchMin(
      app,
      `/users/${userId4}`,
      { password: 'Xyz*123' },
      tokens.adminToken,
      HttpStatus.FORBIDDEN,
    );
  });

  it('should allow root user', async () => {
    const [userId4] = await insertUsers({
      name: 'User 4',
      email: 'user4@email.com',
      password: 'Abc12*',
      roles: [Role.ROOT],
      active: true,
    });
    await testPatchMin(
      app,
      `/users/${userId4}`,
      { password: 'Xyz*123' },
      tokens.rootToken,
      HttpStatus.OK,
    );
  });
});
