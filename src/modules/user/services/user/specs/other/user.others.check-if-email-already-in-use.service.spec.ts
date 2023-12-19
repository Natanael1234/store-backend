import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../../../authentication/services/authentication/authentication.service';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { TextMessage } from '../../../../../system/messages/text/text.messages';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } = UserConfigs;

const PasswordMessage = new TextMessage('password', {
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: PASSWORD_MAX_LENGTH,
});

describe('UserService (checkIfEmailAlreadyInUse)', () => {
  let module: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    module = await getTestingModule();
    userService = module.get<UserService>(UserService);
    authenticationService = module.get<AuthenticationService>(
      AuthenticationService,
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should check if email already in use', async () => {
    const createData = [
      {
        name: 'User 1',
        password: 'Abc12*',
        email: 'user1@email.com',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.USER],
        active: false,
      },
      {
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.ADMIN],
      },
    ];
    await userService.create(createData[0]);
    await userService.create(createData[1]);
    await userService.create(createData[2]);

    const retExistentEmail = await userService.checkIfEmailAlreadyInUse(
      createData[1].email,
    );

    expect(retExistentEmail).toBe(true);
    const retInexistentEmail = await userService.checkIfEmailAlreadyInUse(
      'inexistent@email.com',
    );
  });

  it('should check if email is not in use', async () => {
    const createData = [
      {
        name: 'User 1',
        password: 'Abc12*',
        email: 'user1@email.com',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.USER],
        active: false,
      },
      {
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.ADMIN],
      },
    ];
    await userService.create(createData[0]);
    await userService.create(createData[1]);
    await userService.create(createData[2]);

    const ret = await userService.checkIfEmailAlreadyInUse(
      'notinuse@email.com',
    );

    expect(ret).toBe(false);
  });

  it('should not fail when table is empty', async () => {
    const ret = await userService.checkIfEmailAlreadyInUse(
      'notinuse@email.com',
    );
    expect(ret).toBe(false);
  });
});
