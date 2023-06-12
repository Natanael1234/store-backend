import { SortMessage } from '../../../modules/system/enums/messages/sort-messages/sort-messages.enum';

export class TestDtoSort<Enum extends Record<string, string>> {
  constructor(
    private readonly defaultDTOData: object,
    private readonly enumeration: Enum,
    private readonly defaultOrderBy: Enum[keyof Enum][],
  ) {}

  get acceptData() {
    const keys = Object.keys(this.enumeration);
    const values = Object.values(this.enumeration);
    const length = keys.length;
    if (!length) {
      throw new Error('Enum has no keys');
    }

    const lastValue = values[length - 1];
    const data = [
      {
        description: 'should accept when "orderBy" is not defined',
        data: {},
        expectedResult: {
          ...this.defaultDTOData,
          orderBy: this.defaultOrderBy,
        },
      },
      {
        description: 'should accept when "orderBy" is null',
        data: { orderBy: null },
        expectedResult: {
          ...this.defaultDTOData,
          orderBy: this.defaultOrderBy,
        },
      },
      {
        description: 'should accept when "orderBy" is "null"',
        data: { orderBy: null },
        expectedResult: {
          ...this.defaultDTOData,
          orderBy: this.defaultOrderBy,
        },
      },
      {
        description: 'should accept when "orderBy" is undefined',
        data: { orderBy: undefined },
        expectedResult: {
          ...this.defaultDTOData,
          orderBy: this.defaultOrderBy,
        },
      },
      {
        description: 'should accept when "orderBy" is "undefined"',
        data: { orderBy: undefined },
        expectedResult: {
          ...this.defaultDTOData,
          orderBy: this.defaultOrderBy,
        },
      },
      {
        description: 'should accept when "orderBy" is []',
        data: { orderBy: [] },
        expectedResult: {
          ...this.defaultDTOData,
          orderBy: this.defaultOrderBy,
        },
      },
      ...Object.keys(this.enumeration).map((key) => {
        const value = `${this.enumeration[key]}`;
        return {
          description: `should accept when "orderBy" is ["${value}"]`,
          data: { orderBy: [value] },
          expectedResult: {
            ...this.defaultDTOData,
            orderBy: [value],
          },
        };
      }),
      ...Object.keys(this.enumeration).map((key) => {
        return {
          description: `should accept when "orderBy" is [OrderEnum.${key}]`,
          data: { orderBy: [this.enumeration[key]] },
          expectedResult: {
            ...this.defaultDTOData,
            orderBy: [this.enumeration[key]],
          },
        };
      }),
      {
        description: 'should accept orderBy as json array string',
        data: { orderBy: JSON.stringify(values) },
        expectedResult: {
          ...this.defaultDTOData,
          orderBy: values,
        },
      },
      {
        description:
          'should accept when orderBy is a single valid value json array string',
        data: { orderBy: JSON.stringify([lastValue]) },
        expectedResult: {
          ...this.defaultDTOData,
          orderBy: [lastValue],
        },
      },
      {
        description:
          'should accept and transform into default value when orderBy is empty string',
        data: { orderBy: '' },
        expectedResult: {
          ...this.defaultDTOData,
          orderBy: this.defaultOrderBy,
        },
      },
    ];
    return data;
  }

  get errorData() {
    const keys = Object.keys(this.enumeration);
    const length = keys.length;
    if (!length) {
      throw new Error('Enum has no keys');
    }
    const lastValue = keys[length - 1];
    const data = [
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
        data: { orderBy: ['invalid_impossible_and_never_gonna_happen'] },
        constraints: {
          isEnum: SortMessage.INVALID,
        },
      },
      {
        description:
          'should fail when one orderBy intem, in a string list with lenght=1, is invalid',
        data: { orderBy: 'invalid_impossible_and_never_gonna_happen' },
        constraints: {
          isEnum: SortMessage.INVALID,
        },
      },
      {
        description:
          'should fail when one orderBy item, in comma separated string, is invalid',
        data: {
          orderBy: `${lastValue},invalid_impossible_and_never_gonna_happen`,
        },
        constraints: {
          isEnum: SortMessage.INVALID,
        },
      },
    ];
    return data;
  }
}
