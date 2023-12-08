import { plainToInstance } from 'class-transformer';
import { PaginationConfigs } from '../../../system/configs/pagination/pagination.configs';
import { TextQueryConfigs } from '../../../system/configs/text-query/text-query.configs';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../system/messages/bool/bool.messages';
import { TextMessageOLD } from '../../../system/messages/text-old/text.messages.enum';
import { validateFirstError } from '../../../system/utils/validation/validation';
import { UserConfigs } from '../../configs/user/user.configs';
import { UserOrder } from '../../enums/sort/user-order/user-order.enum';
import { FindUserRequestDTO } from './find-users.request.dto';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

async function testAccept(data: FindUserRequestDTO, expectedResult: any) {
  const dto = plainToInstance(FindUserRequestDTO, data);
  expect(dto).toEqual(expectedResult);
  const errors = await validateFirstError(data, FindUserRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(
  data: FindUserRequestDTO,
  constraints: { [type: string]: string },
) {
  const errors = await validateFirstError(data, FindUserRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('FindUserRequestDTO', () => {
  it('should validate', async () => {
    const data = {
      textQuery: 'test',
      active: 'all',
      deleted: 'not_deleted',
      page: 2,
      pageSize: 4,
      orderBy: ['name_desc', 'active_asc'],
    };
    const dto = plainToInstance(FindUserRequestDTO, data);
    expect(dto).toEqual({
      textQuery: '%test%',
      active: ActiveFilter.ALL,
      deleted: DeletedFilter.NOT_DELETED,
      page: 2,
      pageSize: 4,
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
    });
    const errors = await validateFirstError(data, FindUserRequestDTO);
    expect(errors).toHaveLength(0);
  });

  describe('textQuery', () => {
    it('should accept and format when receives string', async () => {
      await testAccept(
        { textQuery: 'inG 1' },
        {
          textQuery: '%ing%1%',
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept and format when string with irregular spaces', async () => {
      await testAccept(
        { textQuery: ' eS   ing' },
        {
          textQuery: '%es%ing%',
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept and return empty string', async () => {
      await testAccept(
        { textQuery: '' },
        {
          textQuery: '',
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept and return empty string when string is made of spaces', async () => {
      await testAccept(
        { textQuery: '     ' },
        {
          textQuery: '',
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept cut and transform when receives string larger than allowed', async () => {
      await testAccept(
        { textQuery: 'x'.repeat(30) + ' xxx x  ' },
        {
          textQuery:
            '%' +
            'x'.repeat(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH - 5) +
            '%xxx%',
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept not cut when receives string with maximum allowed size', async () => {
      await testAccept(
        { textQuery: 'x'.repeat(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH) },
        {
          textQuery:
            '%' + 'x'.repeat(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH) + '%',
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept when textQuery is null', async () => {
      await testAccept(
        { textQuery: null },
        {
          textQuery: null,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept when textQuery is undefined', async () => {
      await testAccept(
        { textQuery: undefined },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should reject when textQuery is number', async () => {
      await testReject(
        { textQuery: 1 as unknown as string },
        { isString: TextMessageOLD.INVALID },
      );
    });

    it('should reject when textQuery is boolean', async () => {
      await testReject(
        { textQuery: true as unknown as string },
        { isString: TextMessageOLD.INVALID },
      );
    });

    it('should reject when textQuery is array', async () => {
      await testReject(
        { textQuery: [] as unknown as string },
        { isString: TextMessageOLD.INVALID },
      );
    });

    it('should reject when textQuery is object', async () => {
      await testReject(
        { textQuery: [] as unknown as string },
        { isString: TextMessageOLD.INVALID },
      );
    });
  });

  describe('active', () => {
    it('should accept when active is "all"', async () => {
      await testAccept(
        { active: ActiveFilter.ALL },
        {
          textQuery: undefined,
          active: ActiveFilter.ALL,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept when active is "inactive"', async () => {
      await testAccept(
        { active: ActiveFilter.INACTIVE },
        {
          textQuery: undefined,
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept when active is "active"', async () => {
      await testAccept(
        { active: ActiveFilter.ACTIVE },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should replace null active with "active"', async () => {
      await testAccept(
        { active: null },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should replace undefined active with "active"', async () => {
      await testAccept(
        { active: undefined },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should reject when active is number', async () => {
      await testReject(
        { active: 1 as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is boolean', async () => {
      await testReject(
        { active: true as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is array', async () => {
      await testReject(
        { active: [] as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is object', async () => {
      await testReject(
        { active: {} as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is invalid string', async () => {
      await testReject(
        { active: 'invalid' as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });
  });

  describe('deleted', () => {
    it('should accept when deleted is "all"', async () => {
      await testAccept(
        { deleted: DeletedFilter.ALL },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.ALL,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept when deleted is "deleted"', async () => {
      await testAccept(
        { deleted: DeletedFilter.DELETED },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should accept when deleted is "not_deleted"', async () => {
      await testAccept(
        { deleted: DeletedFilter.NOT_DELETED },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should replace null deleted with "not_deleted"', async () => {
      await testAccept(
        { deleted: null },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should replace undefined deleted with "not_deleted"', async () => {
      await testAccept(
        { deleted: undefined },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should reject when deleted is number', async () => {
      await testReject(
        { deleted: 1 as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });

    it('should reject when deleted is boolean', async () => {
      await testReject(
        { deleted: true as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });

    it('should reject when deleted is array', async () => {
      await testReject(
        { deleted: [] as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });

    it('should reject when deleted is object', async () => {
      await testReject(
        { deleted: {} as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });

    it('should reject when deleted is invalid string', async () => {
      await testReject(
        { deleted: 'invalid' as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });
  });

  describe('pagination', () => {
    describe('page', () => {
      it('should accept minimum allowed page', async () => {
        await testAccept(
          { page: PaginationConfigs.MIN_PAGE },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should accept page > minimum allowed page', async () => {
        await testAccept(
          { page: PaginationConfigs.MIN_PAGE + 1 },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE + 1,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should accept very great page', async () => {
        await testAccept(
          { page: PaginationConfigs.MIN_PAGE + 1000 },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE + 1000,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value when page is float', async () => {
        await testAccept(
          { page: 1.1 as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value when page is boolean', async () => {
        await testAccept(
          { page: true as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value when page is object', async () => {
        await testAccept(
          { page: {} as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value when page is array', async () => {
        await testAccept(
          { page: [] as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value when page is string', async () => {
        await testAccept(
          { page: '1' as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('pageSize', () => {
      it('should accept minimum pageSize', async () => {
        await testAccept(
          { pageSize: PaginationConfigs.MIN_PAGE },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.MIN_PAGE,
          },
        );
      });

      it('should replace pageSize smaller than allowed with minimum page size', async () => {
        await testAccept(
          { pageSize: PaginationConfigs.MIN_PAGE - 1 },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.MIN_PAGE,
          },
        );
      });

      it('should accept maximum pageSize', async () => {
        await testAccept(
          { pageSize: PaginationConfigs.MAX_PAGE_SIZE },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.MAX_PAGE_SIZE,
          },
        );
      });

      it('should replace pageSize greater than allowed with minimum page size', async () => {
        await testAccept(
          { pageSize: PaginationConfigs.MAX_PAGE_SIZE + 1 },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.MAX_PAGE_SIZE,
          },
        );
      });

      it('should replace pageSize with default value when pageSize is float', async () => {
        await testAccept(
          { pageSize: 1.1 as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace pageSize with default value when pageSize is boolean', async () => {
        await testAccept(
          { pageSize: true as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace pageSize with default value when pageSize is object', async () => {
        await testAccept(
          { pageSize: {} as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace pageSize with default value when pageSize is array', async () => {
        await testAccept(
          { pageSize: [] as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace pageSize with default value when pageSize is string', async () => {
        await testAccept(
          { pageSize: '1' as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('page and pageSize', () => {
      it('should paginate search without sending page and pageSize', async () => {
        await testAccept(
          {},
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should paginate search sending page and pageSize', async () => {
        await testAccept(
          { page: 2, pageSize: 3 },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: 2,
            pageSize: 3,
          },
        );
      });
    });
  });

  describe('sort', () => {
    it("should accept when orderBy = ['name_asc']", async () => {
      await testAccept(
        { orderBy: [UserOrder.NAME_ASC] },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [UserOrder.NAME_ASC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['name_desc']", async () => {
      await testAccept(
        { orderBy: [UserOrder.NAME_DESC] },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [UserOrder.NAME_DESC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['active_asc']", async () => {
      await testAccept(
        { orderBy: [UserOrder.ACTIVE_ASC] },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [UserOrder.ACTIVE_ASC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['active_desc']", async () => {
      await testAccept(
        { orderBy: [UserOrder.ACTIVE_DESC] },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [UserOrder.ACTIVE_DESC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    describe('default values', () => {
      it('should accept and use default values when orderBy is null', async () => {
        await testAccept(
          { orderBy: null },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should accept and use default values when orderBy is undefined', async () => {
        await testAccept(
          { orderBy: undefined },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should accept and use default values when orderBy is empty', async () => {
        await testAccept(
          { orderBy: undefined },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('different column and different direction', () => {
      it("should accept when orderBy = ['name_asc, active_asc']", async () => {
        await testAccept(
          { orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_ASC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['name_asc, active_desc']", async () => {
        await testAccept(
          { orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [UserOrder.NAME_ASC, UserOrder.ACTIVE_DESC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['name_desc, active_desc']", async () => {
        await testAccept(
          { orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_DESC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['name_desc, active_asc']", async () => {
        await testAccept(
          { orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('same column and different direction', () => {
      it("should replace orderBy = ['name_desc, name_asc'] with defaultValues", async () => {
        await testAccept(
          { orderBy: [UserOrder.NAME_ASC, UserOrder.NAME_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['active_desc, active_asc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [UserOrder.ACTIVE_ASC, UserOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('same column and same direction', () => {
      it("should replace orderBy = ['name_asc, name_asc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [UserOrder.NAME_ASC, UserOrder.NAME_ASC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['name_desc, name_desc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [UserOrder.NAME_DESC, UserOrder.NAME_DESC] },

          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['active_asc, active_asc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [UserOrder.ACTIVE_ASC, UserOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['active_desc, active_desc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [UserOrder.ACTIVE_DESC, UserOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('invalid', () => {
      it('should replace orderBy with defaultValues when orderBy is boolean', async () => {
        await testAccept(
          { orderBy: true as unknown as UserOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is number', async () => {
        await testAccept(
          { orderBy: 1 as unknown as UserOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is string', async () => {
        await testAccept(
          { orderBy: '[]' as unknown as UserOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is object', async () => {
        await testAccept(
          { orderBy: {} as unknown as UserOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is number', async () => {
        await testAccept(
          { orderBy: [1] as unknown as UserOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is boolean', async () => {
        await testAccept(
          { orderBy: [true] as unknown as UserOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is array', async () => {
        await testAccept(
          { orderBy: [[]] as unknown as UserOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is invalid string', async () => {
        await testAccept(
          { orderBy: ['invalid_asc'] as unknown as UserOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is object', async () => {
        await testAccept(
          { orderBy: [{}] as unknown as UserOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: UserConfigs.USER_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });
  });

  describe('multiple errors', () => {
    it('should fail with multiple errors', async () => {
      const data = {
        textQuery: true,
        active: 'invalid',
        deleted: 'invalid',
        page: '-1.5',
        pageSize: 'invalid',
        orderBy: ['invalid'],
      };

      const errors = await validateFirstError(data, FindUserRequestDTO);
      expect(errors).toHaveLength(3);
      expect(errors[0].constraints).toEqual({
        isString: TextMessageOLD.INVALID,
      });
      expect(errors[1].constraints).toEqual({
        isEnum: ActiveMessage.INVALID,
      });
      expect(errors[2].constraints).toEqual({
        isEnum: DeletedMessage.INVALID,
      });
    });
  });
});
