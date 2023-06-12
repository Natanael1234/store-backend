import { TestAcceptData, TestData, TestErrorData } from '../test-data';

export function getFKErrorDataList(options: {
  property: string;
  dtoData;
  allowUndefined?: boolean;
  allowNull?: boolean;
  messages: {
    invalid: string;
    type: string;
    undefined: string;
    null: string;
  };
}): TestErrorData[] {
  const { property, dtoData, messages, allowUndefined, allowNull } = options;
  const list = [
    TestData.buildErrorData({
      description: 'negative',
      property,
      value: -1,
      data: dtoData,
      errors: { isForeignKey: messages.invalid },
      message: { [property]: messages.invalid },
    }),
    TestData.buildErrorData({
      description: 'float',
      property,
      value: 1.1,
      data: dtoData,
      errors: { isForeignKey: messages.type },
      message: { [property]: messages.type },
    }),
    TestData.buildErrorData({
      description: 'string',
      property,
      value: '5',
      data: dtoData,
      errors: { isForeignKey: messages.type },
      message: { [property]: messages.type },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      property,
      value: true,
      data: dtoData,
      errors: { isForeignKey: messages.type },
      message: { [property]: messages.type },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isForeignKey: messages.type },
      message: { [property]: messages.type },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isForeignKey: messages.type },
      message: { [property]: messages.type },
    }),
  ];
  if (!allowUndefined) {
    TestData.buildErrorData({
      description: 'undefined',
      property,
      value: undefined,
      data: dtoData,
      errors: { isForeignKey: messages.undefined },
      message: { [property]: messages.undefined },
    });
  }
  if (!allowNull) {
    list.push(
      TestData.buildErrorData({
        description: 'null',
        property,
        value: null,
        data: dtoData,
        errors: { isForeignKey: messages.null },
        message: { [property]: messages.null },
      }),
    );
  }
  return list;
}

export function getFKAcceptableValues(options: {
  property: string;
  dtoData: any;
  allowUndefined?: boolean;
  allowNull?: boolean;
}): TestAcceptData[] {
  const { property, dtoData, allowUndefined, allowNull } = options;
  const list = [
    TestData.buildAcceptableValues({
      property,
      description: 'min value',
      data: dtoData,
      value: 1,
    }),
  ];

  if (allowUndefined) {
    list.push(
      TestData.buildAcceptableValues({
        property,
        description: 'undefined',
        data: dtoData,
        value: undefined,
      }),
    );
  }
  if (allowNull) {
    list.push(
      TestData.buildAcceptableValues({
        property,
        description: 'null',
        data: dtoData,
        value: null,
      }),
    );
  }

  return list;
}
