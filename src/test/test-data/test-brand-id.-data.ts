import { BrandIdMessage } from '../../modules/stock/enums/brand-id-messages/brand-id-quantity-messages.enum';
import {
  TestAcceptData,
  TestData,
  TestErrorData,
  TestPurpose,
} from '../test-data';

export function getBrandIdErrorDataList(
  dtoData,
  purpose: TestPurpose,
): TestErrorData[] {
  const property = 'brandId';
  const list = [
    TestData.buildErrorData({
      description: 'negative',
      property,
      value: -1,
      data: dtoData,
      errors: { min: BrandIdMessage.INVALID },
      message: { [property]: BrandIdMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'float',
      property,
      value: 1.1,
      data: dtoData,
      errors: { isInt: BrandIdMessage.INT },
      message: { [property]: BrandIdMessage.INT },
    }),
    TestData.buildErrorData({
      description: 'string',
      property,
      value: '5',
      data: dtoData,
      errors: { isInt: BrandIdMessage.INT },
      message: { [property]: BrandIdMessage.INT },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      property,
      value: true,
      data: dtoData,
      errors: { isInt: BrandIdMessage.INT },
      message: { [property]: BrandIdMessage.INT },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isInt: BrandIdMessage.INT },
      message: { [property]: BrandIdMessage.INT },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isInt: BrandIdMessage.INT },
      message: { [property]: BrandIdMessage.INT },
    }),
  ];
  if (purpose != 'update') {
    list.push(
      TestData.buildErrorData({
        description: 'undefined',
        property,
        value: undefined,
        data: dtoData,
        errors: { isNotEmpty: BrandIdMessage.REQUIRED },
        message: { [property]: BrandIdMessage.REQUIRED },
      }),
      TestData.buildErrorData({
        description: 'null',
        property,
        value: null,
        data: dtoData,
        errors: { isNotEmpty: BrandIdMessage.REQUIRED },
        message: { [property]: BrandIdMessage.REQUIRED },
      }),
    );
  }
  return list;
}

export function getBrandIdAcceptableValues(
  dtoData: any,
  purpose: TestPurpose,
): TestAcceptData[] {
  const property = 'brandId';
  const list = [
    TestData.buildAcceptableValues({
      property,
      description: 'min value',
      data: dtoData,
      value: 1,
    }),
  ];
  if (purpose == 'update') {
    list.push(
      // TestData.buildAcceptableValues({property, description: 'null', datA: dtoData, value: null}),
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
