import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { PaginationConfigs } from '../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../system/constants/sort/sort.constants';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { DeletedFilter } from '../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

describe('UserService.find (deleted)', () => {
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

  it('should retrieve deleted and non deleted users when deleted = "all"', async () => {
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
          deletedAt: new Date(),
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
      .withDeleted()
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ deleted: DeletedFilter.ALL });
    expect(response).toEqual({
      textQuery: undefined,
      count: 3,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve deleted users when deleted = "deleted"', async () => {
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
          deletedAt: new Date(),
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
      .where(UserConstants.USER_DELETED_AT_IS_NOT_NULL)
      .withDeleted()
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ deleted: DeletedFilter.DELETED });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve not deleted users when deleted = "not_deleted"', async () => {
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
          deletedAt: new Date(),
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
    const response = await userService.find({
      deleted: DeletedFilter.NOT_DELETED,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve not deleted users when deleted = null', async () => {
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
          deletedAt: new Date(),
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
    const response = await userService.find({ deleted: null });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should retrieve not deleted users when deleted = undefined', async () => {
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
          deletedAt: new Date(),
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
    const response = await userService.find({ deleted: undefined });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should reject when deleted is invalid boolean', async () => {
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
          deletedAt: new Date(),
        },
      ])
      .execute();
    const fn = () =>
      userService.find({ deleted: true as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deleted is invalid array', async () => {
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
          deletedAt: new Date(),
        },
      ])
      .execute();
    const fn = () =>
      userService.find({ deleted: [] as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deleted is invalid object', async () => {
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
          deletedAt: new Date(),
        },
      ])
      .execute();
    const fn = () =>
      userService.find({ deleted: {} as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deleted is invalid string', async () => {
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
          deletedAt: new Date(),
        },
      ])
      .execute();
    const fn = () =>
      userService.find({ deleted: '1' as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
