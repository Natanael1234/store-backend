import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { PaginationConfigs } from '../../../../system/configs/pagination/pagination.configs';
import { TextQueryConfigs } from '../../../../system/configs/text-query/text-query.configs';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { TextMessageOLD } from '../../../../system/messages/text-old/text.messages.enum';
import { UuidListMessage } from '../../../../system/messages/uuid-list/uuid-list.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { CategoryConfigs } from '../../configs/category/category.configs';
import { CategoryOrder } from '../../enums/category-order/category-order.enum';
import { FindCategoriesRequestDTO } from './find-categories.request.dto';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

async function testAccept(
  data: {
    textQuery?: string;
    parentIds?: string[];
    active?: ActiveFilter;
    deleted?: DeletedFilter;
    orderBy?: CategoryOrder[];
    page?: number;
    pageSize?: number;
  },
  expectedResult: any,
) {
  const dto = plainToInstance(FindCategoriesRequestDTO, data);
  expect(dto).toEqual(expectedResult);
  const errors = await validateFirstError(data, FindCategoriesRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(
  data: FindCategoriesRequestDTO,
  constraints: { [type: string]: string },
) {
  const errors = await validateFirstError(data, FindCategoriesRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('FindCategoriesRequestDTO', () => {
  it('should validade', async () => {
    const categoryId1 = uuidv4();
    const categoryId2 = uuidv4();
    await testAccept(
      {
        textQuery: 'inG 1',
        parentIds: [categoryId1, categoryId2],
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
        orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
      {
        textQuery: '%ing%1%',
        parentIds: [categoryId1, categoryId2],
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
        orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  describe('textQuery', () => {
    it('should accept and format when receives string', async () => {
      await testAccept(
        { textQuery: 'inG 1' },
        {
          textQuery: '%ing%1%',
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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

  describe('parentIds', () => {
    const Message = new UuidListMessage('parent ids');

    it('should accept parentIds', async () => {
      const parentIds = [uuidv4(), uuidv4(), uuidv4()];
      const data = {
        textQuery: 'test',
        parentIds,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindCategoriesRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        parentIds,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindCategoriesRequestDTO);
      expect(errors).toHaveLength(0);
    });

    // null

    it('should accept when parentIds is null', async () => {
      const data = {
        textQuery: 'test',
        parentIds: null,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindCategoriesRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        parentIds: null,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindCategoriesRequestDTO);
      expect(errors).toHaveLength(0);
    });

    it('should accept when parentIds item is null', async () => {
      const data = {
        textQuery: 'test',
        parentIds: [null],
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindCategoriesRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        parentIds: [null],
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindCategoriesRequestDTO);
      expect(errors).toHaveLength(0);
    });

    // undefined

    it('should accept when parentIds is undefined', async () => {
      const data = {
        textQuery: 'test',
        parentIds: undefined,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindCategoriesRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        parentIds: undefined,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindCategoriesRequestDTO);
      expect(errors).toHaveLength(0);
    });

    // min length

    it('should accept when parentIds is empty', async () => {
      const dto = plainToInstance(FindCategoriesRequestDTO, { parentIds: [] });
      expect(dto).toEqual({
        textQuery: undefined,
        parentIds: [],
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
      });
      const errors = await validateFirstError(
        { parentIds: [] },
        FindCategoriesRequestDTO,
      );
      expect(errors).toHaveLength(0);
    });

    // max length

    it('should accept when parentIds has maximum allowed length', async () => {
      const parentIds = Array.from(
        Array(CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH).keys(),
        (item) => uuidv4(),
      );
      await testAccept(
        { parentIds },
        {
          textQuery: undefined,
          parentIds: parentIds,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should reject when parentIds is longer than allowed', async () => {
      const parentIds = Array.from(
        Array(CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH + 1).keys(),
        (item) => uuidv4(),
      );
      const Message = new UuidListMessage('parent ids', {
        maxLength: CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH,
      });

      await testReject({ parentIds }, { isUuidList: Message.MAX_LEN });
    });

    // invalid

    it('should reject when parentIds is number', async () => {
      await testReject(
        { parentIds: 1 as unknown as string[] },
        { isUuidList: Message.INVALID },
      );
    });

    it('should reject when parentIds is boolean', async () => {
      await testReject(
        { parentIds: true as unknown as string[] },
        { isUuidList: Message.INVALID },
      );
    });

    it('should reject when parentIds is string', async () => {
      await testReject(
        { parentIds: `[${uuidv4()}]` as unknown as string[] },
        { isUuidList: Message.INVALID },
      );
    });

    it('should reject when parentIds is object', async () => {
      await testReject(
        { parentIds: {} as unknown as string[] },
        { isUuidList: Message.INVALID },
      );
    });

    // invalid items

    describe('items', () => {
      it('should accept when parentIds is valid', async () => {
        const parentIds = [uuidv4()];
        await testAccept(
          { parentIds },
          {
            textQuery: undefined,
            parentIds,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should accept and remove duplicated parentIds items', async () => {
        const parentId1 = uuidv4();
        const parentId2 = uuidv4();
        const parentId3 = uuidv4();
        const parentId5 = uuidv4();
        const parentId6 = uuidv4();
        const parentIds = [
          parentId1,
          parentId2,
          parentId2,
          parentId3,
          parentId5,
          parentId6,
          parentId6,
        ];
        const nonDuplicatedParentIds = [...new Set(parentIds)];
        await testAccept(
          {
            parentIds,
          },
          {
            textQuery: undefined,
            parentIds: nonDuplicatedParentIds,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should reject when parentIds item is number', async () => {
        await testReject(
          { parentIds: [1 as unknown as string] },
          { isUuidList: Message.ITEM_INVALID },
        );
      });

      it('should reject when parentIds item is boolean', async () => {
        await testReject(
          { parentIds: [true as unknown as string] },
          { isUuidList: Message.ITEM_INVALID },
        );
      });

      it('should reject when parentIds item is invalid string', async () => {
        await testReject(
          { parentIds: ['not-a-valid-uuid'] as unknown as string[] },
          { isUuidList: Message.ITEM_INVALID },
        );
      });

      it('should reject when parentIds item is array', async () => {
        await testReject(
          { parentIds: [[] as unknown as string] },
          { isUuidList: Message.ITEM_INVALID },
        );
      });

      it('should reject when parentIds item is object', async () => {
        await testReject(
          { parentIds: [{} as unknown as string] },
          { isUuidList: Message.ITEM_INVALID },
        );
      });
    });
  });

  describe('active', () => {
    it('should accept when active is "all"', async () => {
      await testAccept(
        { active: ActiveFilter.ALL },
        {
          textQuery: undefined,
          parentIds: undefined,
          active: ActiveFilter.ALL,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.ALL,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE + 1000,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace page with default value when page is float', async () => {
        await testAccept(
          { page: 1.1 },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.MAX_PAGE_SIZE,
          },
        );
      });

      it('should replace pageSize with default value when pageSize is float', async () => {
        await testAccept(
          { pageSize: 1.1 },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
        { orderBy: [CategoryOrder.NAME_ASC] },
        {
          textQuery: undefined,
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [CategoryOrder.NAME_ASC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['name_desc']", async () => {
      await testAccept(
        { orderBy: [CategoryOrder.NAME_DESC] },
        {
          textQuery: undefined,
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [CategoryOrder.NAME_DESC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['active_asc']", async () => {
      await testAccept(
        { orderBy: [CategoryOrder.ACTIVE_ASC] },
        {
          textQuery: undefined,
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [CategoryOrder.ACTIVE_ASC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['active_desc']", async () => {
      await testAccept(
        { orderBy: [CategoryOrder.ACTIVE_DESC] },
        {
          textQuery: undefined,
          parentIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [CategoryOrder.ACTIVE_DESC],
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
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
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('different column and different direction', () => {
      it("should accept when orderBy = ['name_asc, active_asc']", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_ASC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['name_asc, active_desc']", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.ACTIVE_DESC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['name_desc, active_desc']", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_DESC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['name_desc, active_asc']", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.ACTIVE_ASC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('same column and different direction', () => {
      it("should replace orderBy = ['name_desc, name_asc'] with defaultValues", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.NAME_DESC] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['active_desc, active_asc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.ACTIVE_ASC, CategoryOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('same column and same direction', () => {
      it("should replace orderBy = ['name_asc, name_asc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.NAME_ASC, CategoryOrder.NAME_ASC] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['name_desc, name_desc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.NAME_DESC, CategoryOrder.NAME_DESC] },

          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['active_asc, active_asc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.ACTIVE_ASC, CategoryOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['active_desc, active_desc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [CategoryOrder.ACTIVE_DESC, CategoryOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('invalid', () => {
      it('should replace orderBy with defaultValues when orderBy is boolean', async () => {
        await testAccept(
          { orderBy: true as unknown as CategoryOrder[] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is number', async () => {
        await testAccept(
          { orderBy: 1 as unknown as CategoryOrder[] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is string', async () => {
        await testAccept(
          { orderBy: '[]' as unknown as CategoryOrder[] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is object', async () => {
        await testAccept(
          { orderBy: {} as unknown as CategoryOrder[] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is number', async () => {
        await testAccept(
          { orderBy: [1 as unknown as CategoryOrder] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is boolean', async () => {
        await testAccept(
          { orderBy: [true as unknown as CategoryOrder] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is array', async () => {
        await testAccept(
          { orderBy: [[] as unknown as CategoryOrder] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is invalid string', async () => {
        await testAccept(
          { orderBy: ['invalid_asc' as unknown as CategoryOrder] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is object', async () => {
        await testAccept(
          { orderBy: [{} as unknown as CategoryOrder] },
          {
            textQuery: undefined,
            parentIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });
  });

  describe('multiple errors', () => {
    it('should fail with multiple errors', async () => {
      const CategoryMessage = new UuidListMessage('parent ids', {
        minLength: 1,
        maxLength: 3,
      });
      const data = {
        textQuery: true,
        active: 'invalid',
        deleted: 'invalid',
        parentIds: [1, '-2'],
        page: '-1.5',
        pageSize: 'invalid',
        orderBy: ['invalid'],
      };
      const errors = await validateFirstError(data, FindCategoriesRequestDTO);
      expect(errors).toHaveLength(4);
      expect(errors[0].constraints).toEqual({
        isString: TextMessageOLD.INVALID,
      });
      expect(errors[1].constraints).toEqual({
        isEnum: ActiveMessage.INVALID,
      });
      expect(errors[2].constraints).toEqual({ isEnum: DeletedMessage.INVALID });
      expect(errors[3].constraints).toEqual({
        isUuidList: CategoryMessage.ITEM_INVALID,
      });
    });
  });
});
