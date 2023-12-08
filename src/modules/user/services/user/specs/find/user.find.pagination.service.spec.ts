import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../../../authentication/services/authentication/authentication.service';
import { PaginationConfigs } from '../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../system/constants/sort/sort.constants';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

describe('UserService.find (pagination)', () => {
  let module: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;
  const count = 15;

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

  it('should paginate without sending pagination params', async () => {
    const hash = await encryptionService.encrypt('Abc12*');
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(
        Array.from(Array(count), (x, i) => ({
          name: `User ${i + 1}`,
          email: `user${i + 1}@email.com`,
          hash: hash,
          roles: [Role.ROOT],
          active: true,
        })),
      )
      .execute();

    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find();
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when pagination params is null', async () => {
    const hash = await encryptionService.encrypt('Abc12*');
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(
        Array.from(Array(count), (x, i) => ({
          name: `User ${i + 1}`,
          email: `user${i + 1}@email.com`,
          hash: hash,
          roles: [Role.ROOT],
          active: true,
        })),
      )
      .execute();

    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when pagination params is undefined', async () => {
    const hash = await encryptionService.encrypt('Abc12*');
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(
        Array.from(Array(count), (x, i) => ({
          name: `User ${i + 1}`,
          email: `user${i + 1}@email.com`,
          hash: hash,
          roles: [Role.ROOT],
          active: true,
        })),
      )
      .execute();

    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find(undefined);
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when params is empty', async () => {
    const hash = await encryptionService.encrypt('Abc12*');
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(
        Array.from(Array(count), (x, i) => ({
          name: `User ${i + 1}`,
          email: `user${i + 1}@email.com`,
          hash: hash,
          roles: [Role.ROOT],
          active: true,
        })),
      )
      .execute();

    const page = PaginationConfigs.DEFAULT_PAGE;
    const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({});
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  it('should paginate when params contains valid paramaters', async () => {
    const hash = await encryptionService.encrypt('Abc12*');
    await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(
        Array.from(Array(count), (x, i) => ({
          name: `User ${i + 1}`,
          email: `user${i + 1}@email.com`,
          hash: hash,
          roles: [Role.ROOT],
          active: true,
        })),
      )
      .execute();
    const page = 2;
    const pageSize = 3;
    const regs = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await userService.find({ page, pageSize });
    expect(response).toEqual({
      textQuery: undefined,
      count,
      page,
      pageSize,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: regs,
    });
  });

  // page

  describe('page', () => {
    it('should paginate when page is minimum allowed', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.MIN_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when page is greater than allowed', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.MIN_PAGE + 1;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when page is very great', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.MIN_PAGE + 1000;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ page });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate using default page when page is null', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ page: null });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate using default page when page is undefined', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ page: undefined });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is float', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ page: 1.1 });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is boolean', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        page: true as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is object', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        page: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is array', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        page: [] as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default page when page is string', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        page: '1' as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });

  // pageSize

  describe('pageSize', () => {
    it('should paginate when pageSize is minimum allowed', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ pageSize });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when pageSize is smaller than allowed', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MIN_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        pageSize: PaginationConfigs.MIN_PAGE_SIZE - 1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when pageSize is maximum allowed', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ pageSize });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate using maximum pageSize when pageSize is greater than allowed', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.MAX_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        pageSize: PaginationConfigs.MAX_PAGE_SIZE + 1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when pageSize is null', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ pageSize: null });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should paginate when pageSize is undefined', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({ pageSize: undefined });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is float', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        pageSize: PaginationConfigs.MIN_PAGE_SIZE + 0.1,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is boolean', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        pageSize: true as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is object', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        pageSize: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is array', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(
          Array.from(Array(count), (x, i) => ({
            name: `User ${i + 1}`,
            email: `user${i + 1}@email.com`,
            hash: hash,
            roles: [Role.ROOT],
            active: true,
          })),
        )
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        pageSize: {} as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });

    it('should use default pageSize when pageSize is string', async () => {
      const hash = await encryptionService.encrypt('Abc12*');
      const data = Array.from(Array(count), (x, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@email.com`,
        hash: hash,
        roles: [Role.ROOT],
        active: true,
      }));
      await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(data)
        .execute();
      const page = PaginationConfigs.DEFAULT_PAGE;
      const pageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;
      const regs = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
        .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
        .getMany();
      const response = await userService.find({
        pageSize: '1' as unknown as number,
      });
      expect(response).toEqual({
        textQuery: undefined,
        count,
        page,
        pageSize,
        orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
        results: regs,
      });
    });
  });
});
