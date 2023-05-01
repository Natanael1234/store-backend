import { ProductQuantityMessage } from '../../modules/stock/enums/quantity-messages/quantity-messages.enum';
import {
  TestAcceptData,
  TestData,
  TestErrorData,
  TestPurpose,
} from '../test-data';

export function getQuantityInStockErrorDataList(dtoData): TestErrorData[] {
  const property = 'quantityInStock';
  const list = [
    TestData.buildErrorData({
      description: 'negative',
      property,
      value: -1,
      data: dtoData,
      errors: { min: ProductQuantityMessage.MIN },
      message: { [property]: ProductQuantityMessage.MIN },
    }),
    TestData.buildErrorData({
      description: 'string',
      property,
      value: '5',
      data: dtoData,
      errors: { isNumber: ProductQuantityMessage.NUMBER },
      message: { [property]: ProductQuantityMessage.NUMBER },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      property,
      value: true,
      data: dtoData,
      errors: { isNumber: ProductQuantityMessage.NUMBER },
      message: { [property]: ProductQuantityMessage.NUMBER },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isNumber: ProductQuantityMessage.NUMBER },
      message: { [property]: ProductQuantityMessage.NUMBER },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isNumber: ProductQuantityMessage.NUMBER },
      message: { [property]: ProductQuantityMessage.NUMBER },
    }),
  ];
  return list;
}

export function getQuantityInStockAcceptableValues(
  dtoData: any,
  purpose: TestPurpose,
): TestAcceptData[] {
  const property = 'quantityInStock';
  const list = [
    TestData.buildAcceptableValues({
      property,
      description: 'min value',
      data: dtoData,
      value: 0,
    }),
    // TestData.buildAcceptableValues(property, 'null', dtoData, null),
    TestData.buildAcceptableValues({
      property,
      description: 'undefined',
      data: dtoData,
      value: undefined,
    }),
  ];
  return list;
}
