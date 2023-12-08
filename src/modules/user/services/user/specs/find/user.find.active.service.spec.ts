import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { PaginationConfigs } from '../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../system/constants/sort/sort.constants';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { ActiveFilter } from '../../../../../system/enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const ActiveMessage = new BoolMessage('active');

describe('UserService.find (active)', () => {
  let module: TestingModule;
  let userService: UserService;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    module = await getTestingModule();
    userService = module.get<UserService>(UserService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should retrieve active and inactive users when active = "all"', async () => {
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
          active: false,
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
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ active: ActiveFilter.ALL });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve inactive users when active = "inactive"', async () => {
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
          active: false,
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
          active: false,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: false })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ active: ActiveFilter.INACTIVE });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve active users when active = "active"', async () => {
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
          active: false,
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
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ active: ActiveFilter.ACTIVE });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve active users when active = null ', async () => {
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
          active: false,
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
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ active: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should filter when active = undefined', async () => {
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
          active: false,
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
          active: false,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ active: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when active is number', async () => {
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
          active: false,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
      ])
      .execute();
    const fn = () => userService.find({ active: 1 as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is boolean', async () => {
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
          active: false,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
      ])
      .execute();
    const fn = () =>
      userService.find({ active: true as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is array', async () => {
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
          active: false,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
      ])
      .execute();
    const fn = () =>
      userService.find({ active: [] as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is object', async () => {
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
          active: false,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
      ])
      .execute();
    const fn = () =>
      userService.find({ active: {} as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when active is invalid string', async () => {
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
          active: false,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: true,
        },
      ])
      .execute();
    const fn = () =>
      userService.find({ active: 'invalid' as unknown as ActiveFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
