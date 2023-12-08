import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../src/.jest/test-config.module';
import { PaginationConfigs } from '../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../src/modules/system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../src/modules/system/messages/text-old/text.messages.enum';
import { ValidationPipe } from '../../../src/modules/system/pipes/custom-validation.pipe';
import { UserConfigs } from '../../../src/modules/user/configs/user/user.configs';
import { UserConstants } from '../../../src/modules/user/constants/user/user-entity.constants';
import { UserOrder } from '../../../src/modules/user/enums/sort/user-order/user-order.enum';
import { User } from '../../../src/modules/user/models/user/user.entity';
import { objectToJSON } from '../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

describe('UserController (e2e) - get /users (main)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let userRepo: Repository<User>;
  let rootToken: string;
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
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  it('should find user with filtering parameters', async () => {
    await userRepo
      .createQueryBuilder()
      .update(User)
      .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user2@email.com' })
      .set({ active: false })
      .execute();
    await userRepo
      .createQueryBuilder(UserConstants.USERS)
      .softDelete()
      .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user3@email.com' })
      .execute();
    const response = await testGetMin(
      app,
      '/users',
      {
        query: JSON.stringify({
          textQuery: 'u er ',
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.ALL,
          page: PaginationConfigs.DEFAULT_PAGE,
          orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
          pageSize: 2,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    const registers = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .andWhere(UserConstants.EMAIL_EQUALS_TO, { email: 'user2@email.com' })
      .withDeleted()
      .getMany();
    expect(response).toEqual({
      textQuery: 'u er',
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: 2,
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
      results: objectToJSON(registers),
    });
  });

  it('should return an array of users without filtering parameters', async () => {
    await userRepo
      .createQueryBuilder()
      .update(User)
      .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user3@email.com' })
      .set({ active: false })
      .execute();

    const registers = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ACTIVE_EQUALS_TO, { active: true })
      .orderBy(UserConstants.USER_NAME, SortConstants.ASC)
      .addOrderBy(UserConstants.USER_ACTIVE, SortConstants.ASC)
      .getMany();

    const response: any = await testGetMin(
      app,
      '/users',
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
      results: objectToJSON(registers),
    });
  });

  it('should reject when data contains multiple errors', async () => {
    const response = await testGetMin(
      app,
      '/users',
      {
        query: JSON.stringify({
          active: 'invalid_asc' as unknown as ActiveFilter,
          deleted: 'invalid_desc' as unknown as DeletedFilter,
          textQuery: true as unknown as string,
          page: '1' as unknown as number,
          pageSize: true as unknown as number,
          orderBy: true as unknown as UserOrder[],
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: {
        active: ActiveMessage.INVALID,
        deleted: DeletedMessage.INVALID,
        textQuery: TextMessageOLD.INVALID,
      },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
