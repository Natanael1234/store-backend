import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../../../authentication/services/authentication/authentication.service';
import { PaginationConfigs } from '../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../system/constants/sort/sort.constants';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../../system/messages/text-old/text.messages.enum';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

describe('UserService.find (textQuery)', () => {
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

  it('should match one result when filtering by text', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_EMAIL_EQUALS_TO, { email: 'user1@email.com' })
      .getMany();
    const response = await userService.find({ textQuery: 'seR 1' });
    expect(response).toEqual({
      textQuery: 'ser 1',
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should match all results when filtering by text', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ textQuery: ' S    r' });
    expect(response).toEqual({
      textQuery: 's r',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should match no results when filtering by text', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const response = await userService.find({ textQuery: '  not  found ' });
    expect(response).toEqual({
      textQuery: 'not found',
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: [],
    });
  });

  it('should not filter by text when textQuery is empty string', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ textQuery: '' });

    expect(response).toEqual({
      textQuery: '',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should not filter by text when textQuery is string made of spaces', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ textQuery: '     ' });
    expect(response).toEqual({
      textQuery: '',
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should not filter by text when textQuery is null', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ textQuery: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should not filter by text when textQuery is undefined', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ textQuery: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when textQuery is number', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const fn = () => userService.find({ textQuery: 1 as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { textQuery: TextMessageOLD.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when textQuery is boolean', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const fn = () => userService.find({ textQuery: true as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { textQuery: TextMessageOLD.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when textQuery is []', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const fn = () => userService.find({ textQuery: [] as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { textQuery: TextMessageOLD.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when textQuery is object', async () => {
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'User 1',
          email: 'user1@email.com',
          hash: await encryptionService.encrypt('Abc12*'),
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
      ])
      .execute();
    const fn = () => userService.find({ textQuery: {} as unknown as string });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { textQuery: TextMessageOLD.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
