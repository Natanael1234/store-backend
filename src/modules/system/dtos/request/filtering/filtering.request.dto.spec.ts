import { plainToInstance } from 'class-transformer';
import { ActiveFilter } from '../../../enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../enums/filter/deleted-filter/deleted-filter.enum';
import { ActiveMessage } from '../../../enums/messages/active-messages/active-messages.enum';
import { DeletedMessage } from '../../../enums/messages/deleted-messages/deleted-messages.enum';
import { TextMessage } from '../../../enums/messages/text-messages/text-messages.enum';
import { validateFirstError } from '../../../utils/validation';
import { FilteringRequestDTO } from './filtering.request.dto';

describe('FilteringRequestDTO', () => {
  it('should be defined', () => {
    expect(new FilteringRequestDTO()).toBeDefined();
  });

  type AcceptType = { description: string; data: any; expectedResult: any };

  const generalAccepts: AcceptType[] = [
    {
      description:
        'should pass validation and transform properties when no property is defined',
      data: {},
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and not transform properties when all properties are already correct',
      data: { query: null, active: 'inactive', deleted: 'deleted' },
      expectedResult: {
        query: null,
        active: ActiveFilter.INACTIVE,
        deleted: DeletedFilter.DELETED,
      },
    },
  ];
  const testTextSearchAcceptData: AcceptType[] = [
    {
      description:
        'should pass validation and transform properties when query is defined',
      data: { query: 'teste' },
      expectedResult: {
        query: 'teste',
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when query is null',
      data: { query: null },
      expectedResult: {
        query: null,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when query is undefined',
      data: { query: undefined },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
  ];

  const testActiveAcceptData: AcceptType[] = [
    {
      description:
        'should pass validation and transform properties when "active" is null',
      data: { active: null },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when "active" is undefined',
      data: { active: undefined },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when "active" is string active',
      data: { active: 'active' },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when "active" is string inactive',
      data: { active: 'inactive' },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.INACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when "active" is string all',
      data: { active: 'all' },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ALL,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
  ];
  const testDeletedAcceptData: AcceptType[] = [
    {
      description:
        'should pass validation and transform properties when "deleted" is null',
      data: { deleted: null },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when "deleted" is undefined',
      data: { deleted: undefined },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when "deleted" is string deleted',
      data: { deleted: 'deleted' },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when "deleted" is string not deleted',
      data: { deleted: 'not_deleted' },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.NOT_DELETED,
      },
    },
    {
      description:
        'should pass validation and transform properties when "deleted" is string all',
      data: { deleted: 'all' },
      expectedResult: {
        query: undefined,
        active: ActiveFilter.ACTIVE,
        deleted: DeletedFilter.ALL,
      },
    },
  ];

  describe.each([
    { property: 'general', accepts: generalAccepts },
    { property: 'query', accepts: testTextSearchAcceptData },
    { property: 'active', accepts: testActiveAcceptData },
    { property: 'deleted', accepts: testDeletedAcceptData },
  ])('$property', ({ accepts }) => {
    it.each(accepts)('$description', async ({ data, expectedResult }) => {
      const errors = await validateFirstError(data, FilteringRequestDTO);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(FilteringRequestDTO, data);
      expect(dto).toEqual(expectedResult);
    });
  });

  type ErrorType = { description: string; data: any; constraints: any };

  const testTextSearchErrorData: ErrorType[] = [
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

  const testActiveErrorData: ErrorType[] = [
    {
      description: '"active" is invalid string',
      data: { active: 'aCtivE' },
      constraints: { isEnum: ActiveMessage.TYPE },
    },
    {
      description: '"active" is empty string',
      data: { active: 'aCtivE' },
      constraints: { isEnum: ActiveMessage.TYPE },
    },
    {
      description: '"active" is boolean',
      data: { active: true },
      constraints: { isEnum: ActiveMessage.TYPE },
    },
    {
      description: '"active" is boolean string',
      data: { active: 'true' },
      constraints: { isEnum: ActiveMessage.TYPE },
    },
    {
      description: '"active" is number',
      data: { active: 4334556 },
      constraints: { isEnum: ActiveMessage.TYPE },
    },
    {
      description: '"active" is object',
      data: { active: {} },
      constraints: { isEnum: ActiveMessage.TYPE },
    },
    {
      description: '"active" is array',
      data: { active: [] },
      constraints: { isEnum: ActiveMessage.TYPE },
    },
  ];

  const testDeletedErrorData: ErrorType[] = [
    {
      description: '"deleted" is invalid string',
      data: { deleted: 'dEleteD' },
      constraints: { isEnum: DeletedMessage.INVALID },
    },
    {
      description: '"deleted" is empty string',
      data: { active: '' },
      constraints: { isEnum: ActiveMessage.TYPE },
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

  describe.each([
    { property: 'query', errors: testTextSearchErrorData },
    { property: 'active', errors: testActiveErrorData },
    { property: 'deleted', errors: testDeletedErrorData },
  ])('$property', ({ property, errors }) => {
    it.each(errors)(
      'should fail when $description',
      async ({ data, constraints }) => {
        const errors = await validateFirstError(data, FilteringRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual(constraints);
      },
    );
  });
});
