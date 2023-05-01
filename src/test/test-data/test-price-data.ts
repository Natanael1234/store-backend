import { PriceMessage } from '../../modules/stock/enums/price-messages/price-messages.enum';
import {
  TestAcceptData,
  TestData,
  TestErrorData,
  TestPurpose,
} from '../test-data';

export function getPriceErrorDataList(
  dtoData,
  purpose: TestPurpose,
): TestErrorData[] {
  const property = 'price';
  const list = [
    TestData.buildErrorData({
      description: 'negative',
      property,
      value: -1,
      data: dtoData,
      errors: { min: PriceMessage.MIN },
      message: { [property]: PriceMessage.MIN },
    }),
    TestData.buildErrorData({
      description: 'string',
      property,
      value: '5',
      data: dtoData,
      errors: { isNumber: PriceMessage.NUMBER },
      message: { [property]: PriceMessage.NUMBER },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      property,
      value: true,
      data: dtoData,
      errors: { isNumber: PriceMessage.NUMBER },
      message: { [property]: PriceMessage.NUMBER },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isNumber: PriceMessage.NUMBER },
      message: { [property]: PriceMessage.NUMBER },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isNumber: PriceMessage.NUMBER },
      message: { [property]: PriceMessage.NUMBER },
    }),
  ];
  if (purpose != 'update') {
    list.push(
      TestData.buildErrorData({
        description: 'undefined',
        property,
        value: undefined,
        data: dtoData,
        errors: { isNotEmpty: PriceMessage.REQUIRED },
        message: { [property]: PriceMessage.REQUIRED },
      }),
      TestData.buildErrorData({
        description: 'null',
        property,
        value: null,
        data: dtoData,
        errors: { isNotEmpty: PriceMessage.REQUIRED },
        message: { [property]: PriceMessage.REQUIRED },
      }),
    );
  }
  return list;
}

export function getPriceAcceptableValues(
  dtoData: any,
  purpose: TestPurpose,
): TestAcceptData[] {
  const property = 'price';
  const list = [
    TestData.buildAcceptableValues({
      property,
      description: 'min value',
      data: dtoData,
      value: 0,
    }),
  ];
  if (purpose == 'update') {
    list.push(
      // TestData.buildAcceptableValues({property,description: 'null', data:dtoData,value: null}),
      TestData.buildAcceptableValues({
        property,
        description: 'undefined',
        data: dtoData,
        value: undefined,
      }),
    );
  }
  return list;
}
