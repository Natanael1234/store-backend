import { ModelMessage } from '../../modules/stock/enums/model-messages/model-messages.enum';
import {
  TestAcceptData,
  TestData,
  TestErrorData,
  TestPurpose,
} from '../test-data';

export function getModelErrorDataList(
  dtoData,
  purpose: TestPurpose,
): TestErrorData[] {
  const property = 'model';
  const list = [
    TestData.buildErrorData({
      description: 'number',
      property,
      value: 2323232,
      data: dtoData,
      errors: { isString: ModelMessage.STRING },
      message: { [property]: ModelMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      property,
      value: true,
      data: dtoData,
      errors: { isString: ModelMessage.STRING },
      message: { [property]: ModelMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isString: ModelMessage.STRING },
      message: { [property]: ModelMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isString: ModelMessage.STRING },
      message: { [property]: ModelMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'too short',
      property,
      value: 'x'.repeat(5),
      data: dtoData,
      errors: { minLength: ModelMessage.MIN_LEN },
      message: { [property]: ModelMessage.MIN_LEN },
    }),
    TestData.buildErrorData({
      description: 'too long',
      property,
      value: 'x'.repeat(61),
      data: dtoData,
      errors: { maxLength: ModelMessage.MAX_LEN },
      message: { [property]: ModelMessage.MAX_LEN },
    }),
    TestData.buildErrorData({
      description: 'empty',
      property,
      value: '',
      data: dtoData,
      errors: { isNotEmpty: ModelMessage.REQUIRED },
      message: { [property]: ModelMessage.REQUIRED },
    }),
  ];
  if (purpose != 'update') {
    list.push(
      TestData.buildErrorData({
        // TODO: deveria ser testado na atualização?
        description: 'null',
        property,
        value: null,
        data: dtoData,
        errors: { isNotEmpty: ModelMessage.REQUIRED },
        message: { [property]: ModelMessage.REQUIRED },
      }),
      TestData.buildErrorData({
        description: 'undefined',
        property,
        value: undefined,
        data: dtoData,
        errors: { isNotEmpty: ModelMessage.REQUIRED },
        message: { [property]: ModelMessage.REQUIRED },
      }),
    );
  }
  return list;
}

export function getModelAcceptableValues(
  dtoData,
  purpose: TestPurpose,
): TestAcceptData[] {
  const property = 'model';
  const minLen = 'x'.repeat(6);
  const maxLen = 'x'.repeat(60);
  const list = [
    TestData.buildAcceptableValues({
      property,
      description: 'min length',
      data: dtoData,
      value: minLen,
    }),
    TestData.buildAcceptableValues({
      property,
      description: 'max length',
      data: dtoData,
      value: maxLen,
    }),
  ];
  if (purpose == 'update') {
    list.push(
      // TestData.buildAcceptableValues({property,description: 'null',data: dtoData,value: null}),
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
