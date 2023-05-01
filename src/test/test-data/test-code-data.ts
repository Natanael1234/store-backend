import { CodeMessage } from '../../modules/stock/enums/code-messages/code-messages.enum';
import {
  TestAcceptData,
  TestData,
  TestErrorData,
  TestPurpose,
} from '../test-data';

export function getCodeErrorDataList(
  dtoData,
  purpose: TestPurpose,
): TestErrorData[] {
  const property = 'code';
  const list = [
    TestData.buildErrorData({
      description: 'number',
      property,
      value: 2323232,
      data: dtoData,
      errors: { isString: CodeMessage.STRING },
      message: { [property]: CodeMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      property,
      value: true,
      data: dtoData,
      errors: { isString: CodeMessage.STRING },
      message: { [property]: CodeMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isString: CodeMessage.STRING },
      message: { [property]: CodeMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isString: CodeMessage.STRING },
      message: { [property]: CodeMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'too short',
      property,
      value: 'x'.repeat(5),
      data: dtoData,
      errors: { minLength: CodeMessage.MIN_LEN },
      message: { [property]: CodeMessage.MIN_LEN },
    }),
    TestData.buildErrorData({
      description: 'too long',
      property,
      value: 'x'.repeat(61),
      data: dtoData,
      errors: { maxLength: CodeMessage.MAX_LEN },
      message: { [property]: CodeMessage.MAX_LEN },
    }),
    TestData.buildErrorData({
      description: 'empty',
      property,
      value: '',
      data: dtoData,
      errors: { isNotEmpty: CodeMessage.REQUIRED },
      message: { [property]: CodeMessage.REQUIRED },
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
        errors: { isNotEmpty: CodeMessage.REQUIRED },
        message: { [property]: CodeMessage.REQUIRED },
      }),
      TestData.buildErrorData({
        description: 'undefined',
        property,
        value: undefined,
        data: dtoData,
        errors: { isNotEmpty: CodeMessage.REQUIRED },
        message: { [property]: CodeMessage.REQUIRED },
      }),
    );
  }
  return list;
}

export function getCodeAcceptableValues(
  dtoData: any,
  purpose: TestPurpose,
): TestAcceptData[] {
  const property = 'code';
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
      // TestData.buildAcceptableValues({property, description: 'null', data: dtoData, value: null}),
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
