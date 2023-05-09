import { plainToInstance } from 'class-transformer';
import { PaginationConfig } from '../../../../system/dtos/request/pagination/configs/pagination.config';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { ActiveMessage } from '../../../../system/enums/messages/active-messages/active-messages.enum';
import { DeletedMessage } from '../../../../system/enums/messages/deleted-messages/deleted-messages.enum';
import { PaginationMessage } from '../../../../system/enums/messages/pagination-messages/pagination-messages.enum';
import { SortMessage } from '../../../../system/enums/messages/sort-messages/sort-messages.enum';
import { TextMessage } from '../../../../system/enums/messages/text-messages/text-messages.enum';
import { validateFirstError } from '../../../../system/utils/validation';
import { BrandOrder } from '../../../enums/sort/brand-order/brand-order.enum';
import { FindBrandRequestDTO } from './find-brand.request.dto';

const defaultDtoResults = {
  query: undefined,
  active: ActiveFilter.ACTIVE,
  deleted: DeletedFilter.NOT_DELETED,
  page: PaginationConfig.DEFAULT_PAGE,
  pageSize: PaginationConfig.DEFAULT_PAGE_SIZE,
  orderBy: [BrandOrder.NAME_ASC],
};

describe('FindBrandRequestDTO', () => {
  it('sould validate', async () => {
    const data = {
      query: 'test',
      active: 'all',
      deleted: 'not_deleted',
      page: 2,
      pageSize: 4,
      orderBy: ['name_desc', 'active_asc'],
    };
    const dto = plainToInstance(FindBrandRequestDTO, data);
    expect(dto).toEqual({
      query: 'test',
      active: ActiveFilter.ALL,
      deleted: DeletedFilter.NOT_DELETED,
      page: 2,
      pageSize: 4,
      orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
    });
    const errors = await validateFirstError(data, FindBrandRequestDTO);
    expect(errors).toHaveLength(0);
  });

  describe('query', () => {
    const testTextSeachAcceptData = [
      {
        description:
          'should pass validation and transform properties when query is defined',
        data: { query: 'teste' },
        expectedResult: { ...defaultDtoResults, query: 'teste' },
      },
      {
        description:
          'should pass validation and transform properties when query is null',
        data: { query: null },
        expectedResult: { ...defaultDtoResults, query: null },
      },
      {
        description:
          'should pass validation and transform properties when query is undefined',
        data: { query: undefined },
        expectedResult: { ...defaultDtoResults, query: undefined },
      },
    ];

    it.each(testTextSeachAcceptData)(
      '$description',
      async ({ data, expectedResult }) => {
        const dto = plainToInstance(FindBrandRequestDTO, data);
        expect(dto).toEqual(expectedResult);
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );

    const testTextSearchErrorData = [
      {
        description: '"query" is boolean',
        data: { query: true },
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is number',
        data: { query: 4334556 },
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is object',
        data: { query: {} },
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is array',
        data: { query: [] },
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is boolean',
        data: { query: true },
        constraints: { isString: TextMessage.STRING },
      },
    ];

    it.each(testTextSearchErrorData)(
      'should fail when $description',
      async ({ data, constraints }) => {
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual(constraints);
      },
    );
  });

  describe('active', () => {
    const testActiveAcceptData = [
      {
        description:
          'should pass validation and transform properties when "active" is null',
        data: { active: null },
        expectedResult: { ...defaultDtoResults, active: ActiveFilter.ACTIVE },
      },
      {
        description:
          'should pass validation and transform properties when "active" is undefined',
        data: { active: undefined },
        expectedResult: { ...defaultDtoResults, active: ActiveFilter.ACTIVE },
      },
      {
        description:
          'should pass validation and transform properties when "active" is string active',
        data: { active: 'active' },
        expectedResult: { ...defaultDtoResults, active: ActiveFilter.ACTIVE },
      },
      {
        description:
          'should pass validation and transform properties when "active" is string inactive',
        data: { active: 'inactive' },
        expectedResult: { ...defaultDtoResults, active: ActiveFilter.INACTIVE },
      },
      {
        description:
          'should pass validation and transform properties when "active" is string all',
        data: { active: 'all' },
        expectedResult: { ...defaultDtoResults, active: ActiveFilter.ALL },
      },
    ];

    it.each(testActiveAcceptData)(
      '$description',
      async ({ data, expectedResult }) => {
        const dto = plainToInstance(FindBrandRequestDTO, data);
        expect(dto).toEqual(expectedResult);
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );

    const testActiveErrorData = [
      {
        description: '"active" is invalid string',
        data: { active: 'aCtivE' },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: '"active" is empty string',
        data: { active: 'aCtivE' },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: '"active" is boolean',
        data: { active: true },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: '"active" is boolean string',
        data: { active: 'true' },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: '"active" is number',
        data: { active: 4334556 },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: '"active" is object',
        data: { active: {} },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: '"active" is array',
        data: { active: [] },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
    ];

    it.each(testActiveErrorData)(
      'should fail when $description',
      async ({ data, constraints }) => {
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual(constraints);
      },
    );
  });

  describe('deleted', () => {
    const testDeletedAcceptData = [
      {
        description:
          'should pass validation and transform properties when "deleted" is null',
        data: { deleted: null },
        expectedResult: {
          ...defaultDtoResults,
          deleted: DeletedFilter.NOT_DELETED,
        },
      },
      {
        description:
          'should pass validation and transform properties when "deleted" is undefined',
        data: { deleted: undefined },
        expectedResult: {
          ...defaultDtoResults,
          deleted: DeletedFilter.NOT_DELETED,
        },
      },
      {
        description:
          'should pass validation and transform properties when "deleted" is string deleted',
        data: { deleted: 'deleted' },
        expectedResult: {
          ...defaultDtoResults,
          deleted: DeletedFilter.DELETED,
        },
      },
      {
        description:
          'should pass validation and transform properties when "deleted" is string not deleted',
        data: { deleted: 'not_deleted' },
        expectedResult: {
          ...defaultDtoResults,
          deleted: DeletedFilter.NOT_DELETED,
        },
      },
      {
        description:
          'should pass validation and transform properties when "deleted" is string all',
        data: { deleted: 'all' },
        expectedResult: { ...defaultDtoResults, deleted: DeletedFilter.ALL },
      },
    ];

    it.each(testDeletedAcceptData)(
      '$description',
      async ({ data, expectedResult }) => {
        const dto = plainToInstance(FindBrandRequestDTO, data);
        expect(dto).toEqual(expectedResult);
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );

    const testDeletedErrorData = [
      {
        description: '"deleted" is invalid string',
        data: { deleted: 'dEleteD' },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: '"deleted" is empty string',
        data: { active: '' },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: '"deleted" is boolean',
        data: { deleted: true },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: '"deleted" is boolean string',
        data: { deleted: 'true' },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: '"deleted" is number',
        data: { deleted: 4334556 },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: '"deleted" is object',
        data: { deleted: {} },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: '"deleted" is array',
        data: { deleted: [] },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
    ];

    it.each(testDeletedErrorData)(
      'should fail when $description',
      async ({ data, constraints }) => {
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual(constraints);
      },
    );
  });

  describe('pagination', () => {
    const testPaginationAcceptData = [
      {
        description: '"page" and "pageSize" are positive int',
        data: { page: 1, pageSize: 1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description: 'should accept and transform "page" when "page" is null',
        data: { page: null, pageSize: 1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is null',
        data: { page: 1, pageSize: null },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "page" and pagSize when "page" and "pageSize" are null',
        data: { page: null, pageSize: null },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "page" when "page" is undefined',
        data: { page: undefined, pageSize: 1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is undefined',
        data: { page: 1, pageSize: undefined },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "page" and "pageSize" when "page" and "pageSize" are undefined',
        data: { page: undefined, pageSize: undefined },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "page" when "page" property is not defined',
        data: { pageSize: 1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" property is not defined',
        data: { page: 1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "pageSize" when "page" and "pageSize" properties is not defined',
        data: {},
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept when "page" and "pageSize" properties are greater then one',
        data: { page: 5, pageSize: 10 },
        expectedResult: { ...defaultDtoResults, page: 5, pageSize: 10 },
      },
      {
        description:
          'should accept and transform "page" when "page" is negative integer',
        data: { page: -1, pageSize: 1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "page" when "page" is string negative integer',
        data: { page: '-1', pageSize: 1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description: 'should accept and transform "page" when "page" is zero',
        data: { page: 0, pageSize: 1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "page" when "page" is string zero',
        data: { page: '0', pageSize: 1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is negative integer',
        data: { page: 1, pageSize: -1 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is string negative integer',
        data: { page: 1, pageSize: '-1' },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is zero',
        data: { page: 1, pageSize: 0 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is string integer zero',
        data: { page: 1, pageSize: '0' },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 1 },
      },
      {
        description: 'should accept when "pageSize" has the maximum size',
        data: { page: 1, pageSize: 40 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 40 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is string integer with the maximum size',
        data: { page: 1, pageSize: `40` },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 40 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is integer greater than maximum size',
        data: { page: 1, pageSize: 41 },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 40 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is string integer greater than max size',
        data: { page: 1, pageSize: `41` },
        expectedResult: { ...defaultDtoResults, page: 1, pageSize: 40 },
      },
    ];

    it.each(testPaginationAcceptData)(
      '$description',
      async ({ data, expectedResult }) => {
        const dto = plainToInstance(FindBrandRequestDTO, data);
        expect(dto).toEqual(expectedResult);
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );

    const testPaginationRejectData = [
      {
        description: '"page" is float',
        data: { page: 1.1, pageSize: 1 },
        constraints: {
          isInt: PaginationMessage.PAGE_INT,
        },
      },
      {
        description: '"page" is string float',
        data: { page: '1.1', pageSize: 1 },
        constraints: {
          isInt: PaginationMessage.PAGE_INT,
        },
      },
      {
        description: '"page" is boolean',
        data: { page: true, pageSize: 1 },
        constraints: {
          isInt: PaginationMessage.PAGE_INT,
        },
      },
      {
        description: '"page" is object',
        data: { page: {}, pageSize: 1 },
        constraints: {
          isInt: PaginationMessage.PAGE_INT,
        },
      },
      {
        description: '"page" is array',
        data: { page: [], pageSize: 1 },
        constraints: {
          isInt: PaginationMessage.PAGE_INT,
        },
      },
      {
        description: '"page" is invalid string',
        data: { page: 'invalid', pageSize: 1 },
        constraints: {
          isInt: PaginationMessage.PAGE_INT,
        },
      },
      {
        description: '"pageSize" is float',
        data: { page: 1, pageSize: 1.1 },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
      {
        description: '"pageSize" is string float',
        data: { page: 1, pageSize: '1.1' },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
      {
        description: '"pageSize" is float less than the minimum allowed',
        data: { page: 1, pageSize: 0.35 },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
      {
        description: '"pageSize" is string float less than the minimum allowed',
        data: { page: 1, pageSize: '-1.1' },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
      {
        description: '"pageSize" is float less than the minimum allowed',
        data: { page: 1, pageSize: -0.1 },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
      {
        description: '"pageSize" is string float less than the minimum allowed',
        data: { page: 1, pageSize: '-0.1' },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
      {
        description: '"pageSize" is boolean',
        data: { page: 1, pageSize: true },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
      {
        description: '"pageSize" is object',
        data: { page: 1, pageSize: {} },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
      {
        description: '"pageSize" is array',
        data: { page: 1, pageSize: [] },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
      {
        description: '"page" is invalid string',
        data: { page: 1, pageSize: 'invalid' },
        constraints: {
          isInt: PaginationMessage.PAGE_SIZE_INT,
        },
      },
    ];

    it.each(testPaginationRejectData)(
      'should fail when $description',
      async ({ data, constraints }) => {
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual(constraints);
      },
    );
  });

  describe('sort', () => {
    const testSortAcceptData = [
      {
        description: 'should accept when "orderBy" is not defined',
        data: {},
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_ASC],
        },
      },
      {
        description: 'should accept when "orderBy" is null',
        data: { orderBy: null },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_ASC],
        },
      },
      {
        description: 'should accept when "orderBy" is undefined',
        data: { orderBy: undefined },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_ASC],
        },
      },
      {
        description: 'should accept when "orderBy" is empty array',
        data: { orderBy: [] },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_ASC],
        },
      },
      {
        description: 'should accept when "orderBy" is "name_asc"',
        data: { orderBy: ['name_asc'] },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_ASC],
        },
      },
      {
        description: 'should accept when "orderBy" is "name_desc"',
        data: { orderBy: ['name_desc'] },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_DESC],
        },
      },
      {
        description: 'should accept when "orderBy" is "active_asc"',
        data: { orderBy: ['active_asc'] },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.ACTIVE_ASC],
        },
      },
      {
        description: 'should accept when "orderBy" is "active_desc"',
        data: { orderBy: ['active_desc'] },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.ACTIVE_DESC],
        },
      },

      {
        description: 'should accept when "orderBy" is BrandOrder.NAME_ASC',
        data: { orderBy: [BrandOrder.NAME_ASC] },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_ASC],
        },
      },
      {
        description: 'should accept when "orderBy" is BrandOrder.NAME_DESC',
        data: { orderBy: [BrandOrder.NAME_DESC] },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_DESC],
        },
      },
      {
        description: 'should accept when "orderBy" is BrandOrder.ACTIVE_ASC',
        data: { orderBy: ['active_asc'] },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.ACTIVE_ASC],
        },
      },
      {
        description: 'should accept when "orderBy" is BrandOrder.ACTIVE_DESC',
        data: { orderBy: [BrandOrder.ACTIVE_DESC] },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.ACTIVE_DESC],
        },
      },
      {
        description:
          'should accept orderBy as comma separated valid values string',
        data: { orderBy: 'name_desc,active_asc' },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_DESC, BrandOrder.ACTIVE_ASC],
        },
      },
      {
        description:
          'should accept when orderBy is a single valid value string',
        data: { orderBy: 'active_asc' },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.ACTIVE_ASC],
        },
      },
      {
        description:
          'should accept and transform into default value when orderBy is empty string',
        data: { orderBy: '' },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_ASC],
        },
      },
      {
        description:
          'should accept and transform into default value when orderBy is ","',
        data: { orderBy: '' },
        expectedResult: {
          ...defaultDtoResults,
          orderBy: [BrandOrder.NAME_ASC],
        },
      },
    ];

    it.each([...testSortAcceptData])(
      '$description',
      async ({ data, expectedResult }) => {
        const dto = plainToInstance(FindBrandRequestDTO, data);
        expect(dto).toEqual(expectedResult);
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );

    const testSortRejectData = [
      {
        description: 'should fail orderBy is invalid type',
        data: { orderBy: true },
        constraints: {
          isEnum: SortMessage.INVALID,
        },
      },
      {
        description: 'should fail when one orderBy item is null',
        data: { orderBy: [null] },
        constraints: {
          isEnum: SortMessage.INVALID,
        },
      },
      {
        description: 'should fail when one orderBy item is undefined',
        data: { orderBy: [undefined] },
        constraints: {
          isEnum: SortMessage.INVALID,
        },
      },
      {
        description: 'should fail when one orderBy item is invalid string',
        data: { orderBy: ['invalid'] },
        constraints: {
          isEnum: SortMessage.INVALID,
        },
      },
      {
        description:
          'should fail when one orderBy intem, in a string list with lenght=1, is invalid',
        data: { orderBy: 'invalid' },
        constraints: {
          isEnum: SortMessage.INVALID,
        },
      },
      {
        description:
          'should fail when one orderBy item, in comma separated string, is invalid',
        data: { orderBy: 'name_asc,invalid' },
        constraints: {
          isEnum: SortMessage.INVALID,
        },
      },
    ];

    it.each([...testSortRejectData])(
      '$description',
      async ({ data, constraints }) => {
        const errors = await validateFirstError(data, FindBrandRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual(constraints);
      },
    );
  });

  describe('multiple errors', () => {
    it('should fail with multiple errors', async () => {
      const data = {
        query: true,
        active: 'invalid',
        deleted: 'invalid',
        page: '-1.5',
        pageSize: 'invalid',
        orderBy: ['invalid'],
      };

      const errors = await validateFirstError(data, FindBrandRequestDTO);
      expect(errors).toHaveLength(6);
      expect(errors[0].constraints).toEqual({
        isString: TextMessage.STRING,
      });
      expect(errors[1].constraints).toEqual({
        isEnum: ActiveMessage.INVALID,
      });
      expect(errors[2].constraints).toEqual({
        isEnum: DeletedMessage.INVALID,
      });
      expect(errors[3].constraints).toEqual({
        isInt: PaginationMessage.PAGE_INT,
      });
      expect(errors[4].constraints).toEqual({
        isInt: PaginationMessage.PAGE_SIZE_INT,
      });
      expect(errors[5].constraints).toEqual({
        isEnum: SortMessage.INVALID,
      });
    });
  });
});
