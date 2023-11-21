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
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { UserOrder } from '../../../../enums/sort/user-order/user-order.enum';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

describe('UserService.find (orderBy)', () => {
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

  it('should order by ["name_asc", "active_asc"]', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_ASC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_ASC],
      results: regs,
    });
  });

  it('should order by ["name_asc", "active_desc"]', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await userService.find({
      orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_DESC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_DESC],
      results: regs,
    });
  });

  it('should order by ["name_desc", "active_asc"]', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.DESC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
      results: regs,
    });
  });

  it('should order by ["name_desc", "active_desc"]', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.DESC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.DESC)
      .getMany();
    const response = await userService.find({
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_DESC],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_DESC],
      results: regs,
    });
  });

  it('should use default order when orderBy is null', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: null,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is undefined', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: undefined,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is string', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: '[]' as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains repeated column', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: ['invadlid_asc'] as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is number', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: undefined,
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is number', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: 1 as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is boolean', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: true as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is array', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: [] as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy is object', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: {} as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid string item', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: ['invalid_asc'] as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid number item', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: [1] as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid boolean item', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();

    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: [true] as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid array item', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: [[]] as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should use default order when orderBy contains invalid object item', async () => {
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
          name: 'User 1',
          email: 'user2@email.com',
          hash: await encryptionService.encrypt('Xyz12*'),
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 2',
          email: 'user3@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user4@email.com',
          hash: await encryptionService.encrypt('Cba12*'),
          roles: [Role.ADMIN],
          active: false,
        },
      ])
      .execute();
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({
      orderBy: [{}] as unknown as UserOrder[],
      active: ActiveFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 4,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });
});
