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
import { ActiveFilter } from '../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../../system/messages/text-old/text.messages.enum';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { UserOrder } from '../../../../enums/sort/user-order/user-order.enum';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

describe('UserService.find (main)', () => {
  let module: TestingModule;
  let userRepo: Repository<User>;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let encryptionService: EncryptionService;

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

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  it('should find user with filtering parameters', async () => {
    const usersData = [];
    let counter = 1;
    for (let i = 0; i < 3; i++) {
      for (let name of ['User 1', 'User 2']) {
        for (let active in [true, false]) {
          for (const deletedAt of [null, new Date()]) {
            usersData.push({
              name,
              email: `email${counter}@email.com`,
              active,
              deletedAt,
              hash: await encryptionService.encrypt('Abc12*'),
              roles: [Role.ROOT],
            });
            counter++;
          }
        }
      }
    }

    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(usersData)
      .execute();
    const registers = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .andWhere(UserConstants.USER_NAME_LIKE_TEXT_QUERY, {
        textQuery: '%ser%1%',
      })
      .andWhere(UserConstants.USER_ACTIVE_EQUALS_TO, { active: false })
      .andWhere(UserConstants.USER_DELETED_AT_IS_NOT_NULL)
      .withDeleted()
      .orderBy(UserConstants.USER_NAME, SortConstants.DESC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .skip(0)
      .take(2)
      .getMany();
    const response = await userService.find({
      textQuery: 'ser  1  ',
      active: ActiveFilter.INACTIVE,
      deleted: DeletedFilter.DELETED,
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: 2,
    });
    expect(response).toEqual({
      textQuery: 'ser 1',
      count: 6,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: 2,
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
      results: registers,
    });
  });

  it('should return an array of users without filtering parameters', async () => {
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
          active: false,
        },
      ])
      .execute();

    const registers = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response: any = await userService.find();
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: registers,
    });
  });

  it('should return empty list', async () => {
    const ret = await userService.find();
    expect(ret).toEqual({
      textQuery: undefined,
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: [],
    });
  });

  it('should reject when data contains multiple errors', async () => {
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
          active: false,
        },
      ])
      .execute();

    const fn = () =>
      userService.find({
        active: 'invalid_asc' as unknown as ActiveFilter,
        deleted: 'invalid_desc' as unknown as DeletedFilter,
        textQuery: true as unknown as string,
        page: '1' as unknown as number,
        pageSize: true as unknown as number,
        orderBy: true as unknown as UserOrder[],
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          active: ActiveMessage.INVALID,
          deleted: DeletedMessage.INVALID,
          textQuery: TextMessageOLD.INVALID,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should use default filter values when findDto is null', async () => {
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
    const response = await userService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default filter values when findDto is undefined', async () => {
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
    const response = await userService.find(undefined);
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });
});
