import { plainToInstance } from 'class-transformer';
import { PaginationMessage } from '../../../enums/messages/pagination-messages/pagination-messages.enum';
import { validateFirstError } from '../../../utils/validation';
import { PaginationRequestDTO } from './pagination.request.dto';

describe('PaginationRequestDTO', () => {
  const acceptable = [
    {
      description: '"page" and "pageSize" are positive int',
      data: { page: 1, pageSize: 1 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description: 'should accept and transform "page" when "page" is null',
      data: { page: null, pageSize: 1 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" is null',
      data: { page: 1, pageSize: null },
      expectedResult: { page: 1, pageSize: 12, skip: 0, take: 12 },
    },
    {
      description:
        'should accept and transform "page" and pagSize when "page" and "pageSize" are null',
      data: { page: null, pageSize: null },
      expectedResult: { page: 1, pageSize: 12, skip: 0, take: 12 },
    },
    {
      description:
        'should accept and transform "page" when "page" is undefined',
      data: { page: undefined, pageSize: 1 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" is undefined',
      data: { page: 1, pageSize: undefined },
      expectedResult: { page: 1, pageSize: 12, skip: 0, take: 12 },
    },
    {
      description:
        'should accept and transform "page" and "pageSize" when "page" and "pageSize" are undefined',
      data: { page: undefined, pageSize: undefined },
      expectedResult: { page: 1, pageSize: 12, skip: 0, take: 12 },
    },
    {
      description:
        'should accept and transform "page" when "page" property is not defined',
      data: { pageSize: 1 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" property is not defined',
      data: { page: 1 },
      expectedResult: { page: 1, pageSize: 12, skip: 0, take: 12 },
    },
    {
      description:
        'should accept and transform "pageSize" when "page" and "pageSize" properties is not defined',
      data: {},
      expectedResult: { page: 1, pageSize: 12, skip: 0, take: 12 },
    },
    {
      description:
        'should accept when "page" and "pageSize" properties are greater then one',
      data: { page: 5, pageSize: 10 },
      expectedResult: { page: 5, pageSize: 10, skip: 40, take: 10 },
    },
    {
      description:
        'should accept and transform "page" when "page" is negative integer',
      data: { page: -1, pageSize: 1 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description:
        'should accept and transform "page" when "page" is string negative integer',
      data: { page: '-1', pageSize: 1 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description: 'should accept and transform "page" when "page" is zero',
      data: { page: 0, pageSize: 1 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description:
        'should accept and transform "page" when "page" is string zero',
      data: { page: '0', pageSize: 1 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" is negative integer',
      data: { page: 1, pageSize: -1 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" is string negative integer',
      data: { page: 1, pageSize: '-1' },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" is zero',
      data: { page: 1, pageSize: 0 },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" is string integer zero',
      data: { page: 1, pageSize: '0' },
      expectedResult: { page: 1, pageSize: 1, skip: 0, take: 1 },
    },
    {
      description: 'should accept when "pageSize" has the maximum size',
      data: { page: 1, pageSize: 40 },
      expectedResult: {
        page: 1,
        pageSize: 40,
        skip: 0,
        take: 40,
      },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" is string integer with the maximum size',
      data: { page: 1, pageSize: `40` },
      expectedResult: {
        page: 1,
        pageSize: 40,
        skip: 0,
        take: 40,
      },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" is integer greater than maximum size',
      data: { page: 1, pageSize: 41 },
      expectedResult: {
        page: 1,
        pageSize: 40,
        skip: 0,
        take: 40,
      },
    },
    {
      description:
        'should accept and transform "pageSize" when "pageSize" is string integer greater than max size',
      data: { page: 1, pageSize: `41` },
      expectedResult: {
        page: 1,
        pageSize: 40,
        skip: 0,
        take: 40,
      },
    },
  ];

  it.each(acceptable)('$description', async ({ data, expectedResult }) => {
    const dto = plainToInstance(PaginationRequestDTO, data);
    expect(dto).toEqual(expectedResult);
    const errors = await validateFirstError(data, PaginationRequestDTO);
    expect(errors).toHaveLength(0);
  });

  const testPaginationErrorsData = [
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

  it.each(testPaginationErrorsData)(
    'should fail when $description',
    async ({ data, constraints }) => {
      const errors = await validateFirstError(data, PaginationRequestDTO);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toEqual(constraints);
    },
  );

  it('should fail with multiple errors', async () => {
    const data = { page: '-1.5', pageSize: 'invalid' };
    const constraints = [
      { isInt: PaginationMessage.PAGE_INT },
      { isInt: PaginationMessage.PAGE_SIZE_INT },
    ];
    const errors = await validateFirstError(data, PaginationRequestDTO);
    expect(errors).toHaveLength(2);
    expect(errors[0].constraints).toEqual(constraints[0]);
    expect(errors[1].constraints).toEqual(constraints[1]);
  });
});
