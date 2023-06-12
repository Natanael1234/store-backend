import { ActiveMessage } from '../../modules/system/enums/messages/active-messages/active-messages.enum';
import { TestAcceptData, TestData, TestErrorData } from '../test-data';

export function getActiveErrorDataList(options: {
  dtoData;
  // purpose: TestPurpose;
}): TestErrorData[] {
  const property = 'active';
  const {
    dtoData,
    // purpose
  } = options;
  const list = [
    TestData.buildErrorData({
      description: 'number',
      property,
      value: 2323232,
      data: dtoData,
      errors: { isBool: ActiveMessage.TYPE },
      message: { [property]: ActiveMessage.TYPE },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isBool: ActiveMessage.TYPE },
      message: { [property]: ActiveMessage.TYPE },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isBool: ActiveMessage.TYPE },
      message: { [property]: ActiveMessage.TYPE },
    }),
    TestData.buildErrorData({
      description: 'invalid',
      property,
      value: 'invalid',
      data: dtoData,
      errors: { isBool: ActiveMessage.TYPE },
      message: { [property]: ActiveMessage.TYPE },
    }),
    TestData.buildErrorData({
      description: 'null',
      property,
      value: null,
      data: dtoData,
      errors: { isBool: ActiveMessage.REQUIRED },
      message: { [property]: ActiveMessage.REQUIRED },
    }),
  ];
  return list;
}

export function getActiveAcceptableValues(options: {
  dtoData;
  // purpose: TestPurpose;
}): TestAcceptData[] {
  const property = 'active';
  const {
    dtoData,
    // purpose
  } = options;
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
    // TestData.buildAcceptableValues({
    //   property,
    //   description: 'null',
    //   data: dtoData,
    //   value: null,
    // }),
    TestData.buildAcceptableValues({
      property,
      description: 'undefined',
      data: dtoData,
      value: undefined,
    }),
  ];
  return list;
}
