import { PaginationMessage } from '../../../modules/system/enums/messages/pagination-messages/pagination-messages.enum';

export class TestDtoPagination {
  constructor(private readonly defaultDTOData: object) {}

  get acceptData() {
    const data = [
      {
        description: '"page" and "pageSize" are positive int',
        data: { page: 1, pageSize: 1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description: 'should accept and transform "page" when "page" is null',
        data: { page: null, pageSize: 1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is null',
        data: { page: 1, pageSize: null },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "page" and pagSize when "page" and "pageSize" are null',
        data: { page: null, pageSize: null },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "page" when "page" is undefined',
        data: { page: undefined, pageSize: 1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is undefined',
        data: { page: 1, pageSize: undefined },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "page" and "pageSize" when "page" and "pageSize" are undefined',
        data: { page: undefined, pageSize: undefined },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "page" when "page" property is not defined',
        data: { pageSize: 1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" property is not defined',
        data: { page: 1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept and transform "pageSize" when "page" and "pageSize" properties is not defined',
        data: {},
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 12 },
      },
      {
        description:
          'should accept when "page" and "pageSize" properties are greater then one',
        data: { page: 5, pageSize: 10 },
        expectedResult: { ...this.defaultDTOData, page: 5, pageSize: 10 },
      },
      {
        description:
          'should accept and transform "page" when "page" is negative integer',
        data: { page: -1, pageSize: 1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "page" when "page" is string negative integer',
        data: { page: '-1', pageSize: 1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description: 'should accept and transform "page" when "page" is zero',
        data: { page: 0, pageSize: 1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "page" when "page" is string zero',
        data: { page: '0', pageSize: 1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is negative integer',
        data: { page: 1, pageSize: -1 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is string negative integer',
        data: { page: 1, pageSize: '-1' },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is zero',
        data: { page: 1, pageSize: 0 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is string integer zero',
        data: { page: 1, pageSize: '0' },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 1 },
      },
      {
        description: 'should accept when "pageSize" has the maximum size',
        data: { page: 1, pageSize: 40 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 40 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is string integer with the maximum size',
        data: { page: 1, pageSize: `40` },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 40 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is integer greater than maximum size',
        data: { page: 1, pageSize: 41 },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 40 },
      },
      {
        description:
          'should accept and transform "pageSize" when "pageSize" is string integer greater than max size',
        data: { page: 1, pageSize: `41` },
        expectedResult: { ...this.defaultDTOData, page: 1, pageSize: 40 },
      },
    ];
    return data;
  }

  get errorData() {
    const data = [
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
    return data;
  }
}
