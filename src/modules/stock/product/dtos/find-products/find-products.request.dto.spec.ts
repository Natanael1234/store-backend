import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { PaginationConfigs } from '../../../../system/configs/pagination/pagination.configs';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { TextMessageOLD } from '../../../../system/messages/text-old/text.messages.enum';
import { UuidListMessage } from '../../../../system/messages/uuid-list/uuid-list.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { ProductConfigs } from '../../configs/product/product.configs';
import { ProductOrder } from '../../enums/product-order/product-order.enum';
import { FindProductRequestDTO } from './find-products.request.dto';

const { FILTER_BRANDS_IDS_MAX_LENGTH, FILTER_CATEGORY_IDS_MAX_LENGTH } =
  ProductConfigs;

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

async function testAccept(data: FindProductRequestDTO, expectedResult: any) {
  const dto = plainToInstance(FindProductRequestDTO, data);
  expect(dto).toEqual(expectedResult);
  const errors = await validateFirstError(data, FindProductRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(
  data: FindProductRequestDTO,
  constraints: { [type: string]: string },
) {
  const errors = await validateFirstError(data, FindProductRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('FindProductsRequestDTO', () => {
  const brandIds = [uuidv4(), uuidv4()];
  const categoryIds = [uuidv4(), uuidv4()];
  it('should validate', async () => {
    const data = {
      textQuery: 'test',
      brandIds,
      categoryIds,
      active: ActiveFilter.ALL,
      deleted: DeletedFilter.NOT_DELETED,
      page: 2,
      pageSize: 4,
      orderBy: ['name_desc', 'active_asc'],
    };
    const dto = plainToInstance(FindProductRequestDTO, data);
    expect(dto).toEqual({
      textQuery: '%test%',
      brandIds,
      categoryIds,
      active: ActiveFilter.ALL,
      deleted: DeletedFilter.NOT_DELETED,
      page: 2,
      pageSize: 4,
      orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
    });
    const errors = await validateFirstError(data, FindProductRequestDTO);
    expect(errors).toHaveLength(0);
  });

  describe('categoryIds', () => {
    const CategoryMessage = new UuidListMessage('category ids');

    it('should accept categoryIds', async () => {
      const categoryIds = [uuidv4(), uuidv4(), uuidv4()];
      const data = {
        textQuery: 'test',
        brandIds: undefined,
        categoryIds,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindProductRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        brandIds: undefined,
        categoryIds,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindProductRequestDTO);
      expect(errors).toHaveLength(0);
    });

    // null

    it('should accept when categoryIds is null', async () => {
      const data = {
        textQuery: 'test',
        brandIds: undefined,
        categoryIds: null,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindProductRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        brandIds: undefined,
        categoryIds: null,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindProductRequestDTO);
      expect(errors).toHaveLength(0);
    });

    it('should reject when categoryIds item is null', async () => {
      const Message = new UuidListMessage('category ids', {});

      await testReject(
        { categoryIds: [null] },
        { isUuidList: Message.ITEM_INVALID },
      );
    });

    // undefined

    it('should accept when categoryIds is undefined', async () => {
      const data = {
        textQuery: 'test',
        brandIds: undefined,
        categoryIds: undefined,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindProductRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        brandIds: undefined,
        categoryIds: undefined,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindProductRequestDTO);
      expect(errors).toHaveLength(0);
    });

    it('should reject when categoryIds item is undefined', async () => {
      const Message = new UuidListMessage('category ids', {});

      await testReject(
        { categoryIds: [undefined] },
        { isUuidList: Message.ITEM_INVALID },
      );
    });

    // min length

    it('should accept when categoryIds is empty', async () => {
      const dto = plainToInstance(FindProductRequestDTO, {
        categoryIds: [],
      });
      expect(dto).toEqual({
        textQuery: undefined,
        brandIds: undefined,
        categoryIds: [],
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      });
      const errors = await validateFirstError(
        { categoryIds: [] },
        FindProductRequestDTO,
      );
      expect(errors).toHaveLength(0);
    });

    // max length

    it('should accept when categoryIds has maximum allowed length', async () => {
      const categoryIds = Array.from(
        Array(FILTER_CATEGORY_IDS_MAX_LENGTH).keys(),
        (item) => uuidv4(),
      );
      await testAccept(
        { categoryIds },
        {
          textQuery: undefined,
          brandIds: undefined,
          categoryIds: categoryIds,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should reject when categoryIds is longer than allowed', async () => {
      const categoryIds = Array.from(
        Array(FILTER_CATEGORY_IDS_MAX_LENGTH + 1).keys(),
        (item) => uuidv4(),
      );
      const Message = new UuidListMessage('category ids', {
        maxLength: FILTER_CATEGORY_IDS_MAX_LENGTH,
      });

      await testReject({ categoryIds }, { isUuidList: Message.MAX_LEN });
    });

    // invalid

    it('should reject when categoryIds is number', async () => {
      await testReject(
        { categoryIds: 1 as unknown as string[] },
        { isUuidList: CategoryMessage.INVALID },
      );
    });

    it('should reject when categoryIds is boolean', async () => {
      await testReject(
        { categoryIds: true as unknown as string[] },
        { isUuidList: CategoryMessage.INVALID },
      );
    });

    it('should reject when categoryIds is string', async () => {
      await testReject(
        { categoryIds: `${uuidv4()}` as unknown as string[] },
        { isUuidList: CategoryMessage.INVALID },
      );
    });

    it('should reject when categoryIds is object', async () => {
      await testReject(
        { categoryIds: {} as unknown as string[] },
        { isUuidList: CategoryMessage.INVALID },
      );
    });

    // invalid items

    describe('items', () => {
      it('should accept when categoryIds is valid', async () => {
        const categoryId = uuidv4();
        await testAccept(
          { categoryIds: [categoryId] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: [categoryId],
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should accept and remove duplicated categoryIds items', async () => {
        const categoryId1 = uuidv4();
        const categoryId2 = uuidv4();
        const categoryId3 = uuidv4();
        const categoryId5 = uuidv4();
        const categoryId6 = uuidv4();
        const categoryIds = [
          categoryId1,
          categoryId2,
          categoryId2,
          categoryId3,
          categoryId5,
          categoryId6,
          categoryId6,
        ];
        const nonDuplicatedcategoryIds = [
          categoryId1,
          categoryId2,
          categoryId3,
          categoryId5,
          categoryId6,
        ];
        await testAccept(
          { categoryIds },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: nonDuplicatedcategoryIds,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should reject when categoryIds item is number', async () => {
        await testReject(
          { categoryIds: [true] as unknown as string[] },
          { isUuidList: CategoryMessage.ITEM_INVALID },
        );
      });

      it('should reject when categoryIds item is float', async () => {
        await testReject(
          { categoryIds: [1 as unknown as string] },
          { isUuidList: CategoryMessage.ITEM_INVALID },
        );
      });

      it('should reject when categoryIds item is invalid string', async () => {
        await testReject(
          { categoryIds: ['not-a-valid-uuid'] as unknown as string[] },
          { isUuidList: CategoryMessage.ITEM_INVALID },
        );
      });

      it('should reject when categoryIds item is array', async () => {
        await testReject(
          { categoryIds: [[]] as unknown as string[] },
          { isUuidList: CategoryMessage.ITEM_INVALID },
        );
      });

      it('should reject when categoryIds item is object', async () => {
        await testReject(
          { categoryIds: [{}] as unknown as string[] },
          { isUuidList: CategoryMessage.ITEM_INVALID },
        );
      });
    });
  });

  describe('brandIds', () => {
    const categoryIds = [uuidv4(), uuidv4(), uuidv4()];
    const brandIs = [uuidv4(), uuidv4()];
    const BrandIdsMessage = new UuidListMessage('brand ids');
    it('should accept brandIds', async () => {
      const data = {
        textQuery: 'test',
        brandIds,
        categoryIds,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindProductRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        brandIds,
        categoryIds,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindProductRequestDTO);
      expect(errors).toHaveLength(0);
    });

    // null

    it('should accept when brandIds is null', async () => {
      const data = {
        textQuery: 'test',
        brandIds: null,
        categoryIds: undefined,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindProductRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        brandIds: null,
        categoryIds: undefined,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindProductRequestDTO);
      expect(errors).toHaveLength(0);
    });

    // undefined

    it('should accept when brandIds is undefined', async () => {
      const data = {
        textQuery: 'test',
        brandIds: undefined,
        categoryIds: undefined,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      };
      const dto = plainToInstance(FindProductRequestDTO, data);
      expect(dto).toEqual({
        textQuery: '%test%',
        brandIds: undefined,
        categoryIds: undefined,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
        page: 2,
        pageSize: 4,
        orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
      });
      const errors = await validateFirstError(data, FindProductRequestDTO);
      expect(errors).toHaveLength(0);
    });

    // min length

    it('should accept when brandIds is empty', async () => {
      const dto = plainToInstance(FindProductRequestDTO, {
        brandIds: [],
      });
      expect(dto).toEqual({
        textQuery: undefined,
        brandIds: [],
        categoryIds: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      });
      const errors = await validateFirstError(
        { brandIds: [] },
        FindProductRequestDTO,
      );
      expect(errors).toHaveLength(0);
    });

    // max length

    it('should accept when brandIds has maximum allowed length', async () => {
      const brandIds = Array.from(
        Array(FILTER_BRANDS_IDS_MAX_LENGTH).keys(),
        (item) => uuidv4(),
      );
      await testAccept(
        { brandIds },
        {
          textQuery: undefined,
          brandIds,
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
          page: PaginationConfigs.DEFAULT_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it('should reject when brandIds is longer than allowed', async () => {
      const brandIds = Array.from(
        Array(FILTER_BRANDS_IDS_MAX_LENGTH + 1).keys(),
        (item) => uuidv4(),
      );
      const Message = new UuidListMessage('brand ids', {
        maxLength: FILTER_BRANDS_IDS_MAX_LENGTH,
      });
      await testReject({ brandIds }, { isUuidList: Message.MAX_LEN });
    });

    // invalid

    it('should reject when brandIds is number', async () => {
      await testReject(
        { brandIds: 1 as unknown as string[] },
        { isUuidList: BrandIdsMessage.INVALID },
      );
    });

    it('should reject when brandIds is boolean', async () => {
      await testReject(
        { brandIds: true as unknown as string[] },
        { isUuidList: BrandIdsMessage.INVALID },
      );
    });

    it('should reject when brandIds is string', async () => {
      await testReject(
        { brandIds: `[${uuidv4()}]` as unknown as string[] },
        { isUuidList: BrandIdsMessage.INVALID },
      );
    });

    it('should reject when brandIds is object', async () => {
      await testReject(
        { brandIds: {} as unknown as string[] },
        { isUuidList: BrandIdsMessage.INVALID },
      );
    });

    // invalid items

    describe('items', () => {
      it('should accept when brandIds item is valid', async () => {
        const brandIds = [uuidv4()];
        await testAccept(
          { brandIds },
          {
            textQuery: undefined,
            brandIds,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should accept and remove duplicated brandIds items', async () => {
        const uuid1 = uuidv4();
        const uuid2 = uuidv4();
        const uuid3 = uuidv4();
        const uuid4 = uuidv4();
        const uuid5 = uuidv4();
        await testAccept(
          { brandIds: [uuid1, uuid2, uuid2, uuid3, uuid4, uuid5, uuid5] },
          {
            textQuery: undefined,
            brandIds: [uuid1, uuid2, uuid3, uuid4, uuid5],
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should reject when brandIds item is boolean', async () => {
        await testReject(
          { brandIds: [true] as unknown as string[] },
          { isUuidList: BrandIdsMessage.ITEM_INVALID },
        );
      });

      it('should reject when brandIds item is number', async () => {
        await testReject(
          { brandIds: [1 as unknown as string] },
          { isUuidList: BrandIdsMessage.ITEM_INVALID },
        );
      });

      it('should reject when brandIds item is invalid string', async () => {
        await testReject(
          { brandIds: ['not-a-valid-uuid'] as unknown as string[] },
          { isUuidList: BrandIdsMessage.ITEM_INVALID },
        );
      });

      it('should reject when brandIds item is array', async () => {
        await testReject(
          { brandIds: [[]] as unknown as string[] },
          { isUuidList: BrandIdsMessage.ITEM_INVALID },
        );
      });

      it('should reject when brandIds item is object', async () => {
        await testReject(
          { brandIds: [{}] as unknown as string[] },
          { isUuidList: BrandIdsMessage.ITEM_INVALID },
        );
      });
    });
  });

  describe('minPrice', () => {
    it.skip('should accept minPrice', async () => {});
  });

  describe('maxPrice', () => {
    it.skip('should accept maxPrice', async () => {});
  });

  describe('minQuantityInStock', () => {
    it.skip('should accept minQuantityInStock', async () => {});
  });

  describe('maxQuantityInStock', () => {
    it.skip('should accept maxQuantityInStock', async () => {});
  });

  describe('active', () => {
    it('should accept when active is "all"', async () => {
      await testAccept(
        { active: ActiveFilter.ALL },
        {
          textQuery: undefined,
          categoryIds: undefined,
          active: ActiveFilter.ALL,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
          categoryIds: undefined,
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.ALL,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE + 1000,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use page default value when page is float', async () => {
        await testAccept(
          { page: PaginationConfigs.MIN_PAGE + 0.1 },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use page default value when page is boolean', async () => {
        await testAccept(
          { page: true as unknown as number },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use page default value when page is object', async () => {
        await testAccept(
          { page: {} as unknown as number },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use page default value when page is array', async () => {
        await testAccept(
          { page: [] as unknown as number },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use page default value when page is string', async () => {
        await testAccept(
          { page: '1' as unknown as number },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.MAX_PAGE_SIZE,
          },
        );
      });

      it('should use maximum page size when page size is greater than allowed', async () => {
        await testAccept(
          { pageSize: PaginationConfigs.MAX_PAGE_SIZE + 1 },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.MAX_PAGE_SIZE,
          },
        );
      });

      it('should use default page size when pageSize is float', async () => {
        await testAccept(
          { pageSize: 1.1 as unknown as number },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use default page size when pageSize is boolean', async () => {
        await testAccept(
          { pageSize: true as unknown as number },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use default page size when pageSize is object', async () => {
        await testAccept(
          { pageSize: {} as unknown as number },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use default page size when pageSize is array', async () => {
        await testAccept(
          { pageSize: [] as unknown as number },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.DEFAULT_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should use default page size when pageSize is string', async () => {
        await testAccept(
          { pageSize: '1' as unknown as number },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
        { orderBy: [ProductOrder.NAME_ASC] },
        {
          textQuery: undefined,
          brandIds: undefined,
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [ProductOrder.NAME_ASC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['name_desc']", async () => {
      await testAccept(
        { orderBy: [ProductOrder.NAME_DESC] },
        {
          textQuery: undefined,
          brandIds: undefined,
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [ProductOrder.NAME_DESC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['active_asc']", async () => {
      await testAccept(
        { orderBy: [ProductOrder.ACTIVE_ASC] },
        {
          textQuery: undefined,
          brandIds: undefined,
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [ProductOrder.ACTIVE_ASC],
          page: PaginationConfigs.MIN_PAGE,
          pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
        },
      );
    });

    it("should accept when orderBy = ['active_desc']", async () => {
      await testAccept(
        { orderBy: [ProductOrder.ACTIVE_DESC] },
        {
          textQuery: undefined,
          brandIds: undefined,
          categoryIds: undefined,
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          orderBy: [ProductOrder.ACTIVE_DESC],
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('different column and different direction', () => {
      it("should accept when orderBy = ['name_asc, active_asc']", async () => {
        await testAccept(
          { orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_ASC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['name_asc, active_desc']", async () => {
        await testAccept(
          { orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [ProductOrder.NAME_ASC, ProductOrder.ACTIVE_DESC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['name_desc, active_desc']", async () => {
        await testAccept(
          { orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_DESC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should accept when orderBy = ['name_desc, active_asc']", async () => {
        await testAccept(
          { orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: [ProductOrder.NAME_DESC, ProductOrder.ACTIVE_ASC],
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('same column and different direction', () => {
      it("should replace orderBy = ['name_desc, name_asc'] with defaultValues", async () => {
        await testAccept(
          { orderBy: [ProductOrder.NAME_ASC, ProductOrder.NAME_DESC] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['active_desc, active_asc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [ProductOrder.ACTIVE_ASC, ProductOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('same column and same direction', () => {
      it("should replace orderBy = ['name_asc, name_asc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [ProductOrder.NAME_ASC, ProductOrder.NAME_ASC] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['name_desc, name_desc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [ProductOrder.NAME_DESC, ProductOrder.NAME_DESC] },

          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['active_asc, active_asc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [ProductOrder.ACTIVE_ASC, ProductOrder.ACTIVE_ASC] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it("should replace orderBy = ['active_desc, active_desc'] with defaulValues", async () => {
        await testAccept(
          { orderBy: [ProductOrder.ACTIVE_DESC, ProductOrder.ACTIVE_DESC] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });
    });

    describe('invalid', () => {
      it('should replace orderBy with defaultValues when orderBy is boolean', async () => {
        await testAccept(
          { orderBy: true as unknown as ProductOrder[] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is number', async () => {
        await testAccept(
          { orderBy: 1 as unknown as ProductOrder[] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is string', async () => {
        await testAccept(
          { orderBy: '[]' as unknown as ProductOrder[] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy is object', async () => {
        await testAccept(
          { orderBy: {} as unknown as ProductOrder[] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is number', async () => {
        await testAccept(
          { orderBy: [1] as unknown as ProductOrder[] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is boolean', async () => {
        await testAccept(
          { orderBy: [true] as unknown as ProductOrder[] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is array', async () => {
        await testAccept(
          { orderBy: [[]] as unknown as ProductOrder[] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is invalid string', async () => {
        await testAccept(
          { orderBy: ['invalid_asc'] as unknown as ProductOrder[] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
            page: PaginationConfigs.MIN_PAGE,
            pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
          },
        );
      });

      it('should replace orderBy with defaultValues when orderBy item is object', async () => {
        await testAccept(
          { orderBy: [{}] as unknown as ProductOrder[] },
          {
            textQuery: undefined,
            brandIds: undefined,
            categoryIds: undefined,
            active: ActiveFilter.ACTIVE,
            deleted: DeletedFilter.NOT_DELETED,
            orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
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

      const errors = await validateFirstError(data, FindProductRequestDTO);
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
