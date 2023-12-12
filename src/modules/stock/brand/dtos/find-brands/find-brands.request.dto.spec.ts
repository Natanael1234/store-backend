import { plainToInstance } from 'class-transformer';
import { PaginationConfigs } from '../../../../system/configs/pagination/pagination.configs';
import { TextQueryConfigs } from '../../../../system/configs/text-query/text-query.configs';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { TextMessageOLD } from '../../../../system/messages/text-old/text.messages.enum';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { BrandConfigs } from '../../configs/brand/brand.configs';
import { BrandOrder } from '../../enums/brand-order/brand-order.enum';
import { FindBrandsRequestDTO } from './find-brands.request.dto';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

async function testAccept(
  data: FindBrandsRequestDTO,
  expectedResult: FindBrandsRequestDTO,
) {
  const dto = plainToInstance(FindBrandsRequestDTO, data);
  expect(dto).toEqual(expectedResult);
  const errors = await validateFirstError(data, FindBrandsRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(data: any, constraints: { [type: string]: string }) {
  const errors = await validateFirstError(data, FindBrandsRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('FindBrandsRequestDTO', () => {
  it('should accept', async () => {
    const data = {
      textQuery: 'test',
      active: 'all',
      deleted: 'not_deleted',
      page: 2,
      pageSize: 4,
      orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
    };
    const dto = plainToInstance(FindBrandsRequestDTO, data);
    expect(dto).toEqual({
      textQuery: '%test%',
      active: ActiveFilter.ALL,
      deleted: DeletedFilter.NOT_DELETED,
      page: 2,
      pageSize: 4,
      orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
    });
    const errors = await validateFirstError(data, FindBrandsRequestDTO);
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
          orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE + 1000,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should user default page when page is float', async () => {
        await testAccept(
          { page: PaginationConfigs.MIN_PAGE + 0.1 },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use default page when page is boolean', async () => {
        await testAccept(
          { page: true as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should repalce page with default value when page is array', async () => {
        await testAccept(
          { page: [] as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use default page when page is string', async () => {
        await testAccept(
          { page: '1' as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.MAX_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value reject when pageSize is float', async () => {
        await testAccept(
          { page: 1.1 as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value reject when pageSize is boolean', async () => {
        await testAccept(
          { page: true as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value reject when pageSize is object', async () => {
        await testAccept(
          { page: {} as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value reject when pageSize is array', async () => {
        await testAccept(
          { page: [] as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value reject when pageSize is string', async () => {
        await testAccept(
          { page: '1' as unknown as number },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: 2,
            pageSize: 3,
          },
        );
      });
    });
  });

  describe('sort', () => {
    it("should accept when orderBy = ['BrandOrder.NAME_ASC']", async () => {
      await testAccept(
        { orderBy: [BrandOrder.NAME_ASC] },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [BrandOrder.NAME_ASC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['BrandOrder.NAME_DESC']", async () => {
      await testAccept(
        { orderBy: [BrandOrder.NAME_DESC] },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [BrandOrder.NAME_DESC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['BrandOrder.ACTIVE_ASC']", async () => {
      await testAccept(
        { orderBy: [BrandOrder.ACTIVE_ASC] },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [BrandOrder.ACTIVE_ASC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['BrandOrder.ACTIVE_DESC']", async () => {
      await testAccept(
        { orderBy: [BrandOrder.ACTIVE_DESC] },
        {
          textQuery: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [BrandOrder.ACTIVE_DESC],
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
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
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('different column and different direction', () => {
      it("should accept when orderBy = ['BrandOrder.NAME_ASC, BrandOrder.ACTIVE_ASC']", async () => {
        await testAccept(
          { orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_ASC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['BrandOrder.NAME_ASC, BrandOrder.ACTIVE_DESC']", async () => {
        await testAccept(
          { orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [BrandOrder.NAME_ASC, BrandOrder.ACTIVE_DESC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['BrandOrder.NAME_DESC, BrandOrder.ACTIVE_DESC']", async () => {
        await testAccept(
          { orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_DESC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC']", async () => {
        await testAccept(
          {
            orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
          },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('same column and different direction', () => {
      it("should replace orderBy = ['BrandOrder.NAME_DESC, BrandOrder.NAME_ASC'] with defaultValues", async () => {
        await testAccept(
          { orderBy: [BrandOrder.NAME_ASC, BrandOrder.NAME_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['BrandOrder.ACTIVE_DESC, BrandOrder.ACTIVE_ASC'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [BrandOrder.ACTIVE_ASC, BrandOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('same column and same direction', () => {
      it("should replace orderBy = ['BrandOrder.NAME_ASC, BrandOrder.NAME_ASC'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [BrandOrder.NAME_ASC, BrandOrder.NAME_ASC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['BrandOrder.NAME_DESC, BrandOrder.NAME_DESC'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [BrandOrder.NAME_DESC, BrandOrder.NAME_DESC] },

          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['BrandOrder.ACTIVE_ASC, BrandOrder.ACTIVE_ASC'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [BrandOrder.ACTIVE_ASC, BrandOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['BrandOrder.ACTIVE_DESC, BrandOrder.ACTIVE_DESC'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [BrandOrder.ACTIVE_DESC, BrandOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('invalid', () => {
      it('should replace orderBy with defaultValues when orderBy is boolean', async () => {
        await testAccept(
          { orderBy: true as unknown as BrandOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is number', async () => {
        await testAccept(
          { orderBy: 1 as unknown as BrandOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is string', async () => {
        await testAccept(
          { orderBy: '[]' as unknown as BrandOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is object', async () => {
        await testAccept(
          { orderBy: {} as unknown as BrandOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is number', async () => {
        await testAccept(
          { orderBy: [1] as unknown as BrandOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is boolean', async () => {
        await testAccept(
          { orderBy: [true] as unknown as BrandOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is array', async () => {
        await testAccept(
          { orderBy: [[]] as unknown as BrandOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is invalid string', async () => {
        await testAccept(
          { orderBy: ['invalid_asc'] as unknown as BrandOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is object', async () => {
        await testAccept(
          { orderBy: [{}] as unknown as BrandOrder[] },
          {
            textQuery: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });
  });
  describe('multiple errors', () => {
    it('should reject with multiple errors', async () => {
      const data = {
        textQuery: true,
        active: 'invalid',
        deleted: 'invalid',
        page: '-1.5',
        pageSize: 'invalid',
        orderBy: ['invalid'],
      };
      const errors = await validateFirstError(data, FindBrandsRequestDTO);
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
