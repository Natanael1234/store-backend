import { ActiveMessage } from '../../modules/system/enums/messages/active-messages/active-messages.enum';
import { TestAcceptData, TestData, TestErrorData } from '../test-data';

export function getActiveErrorDataList(dtoData): TestErrorData[] {
  const property = 'active';
  const list = [
    TestData.buildErrorData({
      description: 'number',
      property,
      value: 2323232,
      data: dtoData,
      errors: { isBoolean: ActiveMessage.BOOLEAN },
      message: { [property]: ActiveMessage.BOOLEAN },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isBoolean: ActiveMessage.BOOLEAN },
      message: { [property]: ActiveMessage.BOOLEAN },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isBoolean: ActiveMessage.BOOLEAN },
      message: { [property]: ActiveMessage.BOOLEAN },
    }),
    TestData.buildErrorData({
      description: 'invalid',
      property,
      value: 'invalid',
      data: dtoData,
      errors: { isBoolean: ActiveMessage.BOOLEAN },
      message: { [property]: ActiveMessage.BOOLEAN },
    }),
  ];
  return list;
}

export function getActiveAcceptableValues(dtoData): TestAcceptData[] {
  const property = 'active';
  const list = [
    TestData.buildAcceptableValues({
      property,
      description: 'boolean true',
      data: dtoData,
      value: true,
    }),
    TestData.buildAcceptableValues({
      property,
      description: 'boolean false',
      data: dtoData,
      value: false,
    }),
    TestData.buildAcceptableValues({
      property,
      description: 'string true',
      data: dtoData,
      value: 'true',
    }),
    TestData.buildAcceptableValues({
      property,
      description: 'string false',
      data: dtoData,
      value: 'false',
    }),
    TestData.buildAcceptableValues({
      property,
      description: 'null',
      data: dtoData,
      value: null,
    }),
    TestData.buildAcceptableValues({
      property,
      description: 'undefined',
      data: dtoData,
      value: undefined,
    }),
  ];
  return list;
}
