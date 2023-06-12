import { NameMessage } from '../../modules/system/enums/messages/name-messages/name-messages.enum';
import {
  TestAcceptData,
  TestData,
  TestErrorData,
  TestPurpose,
} from '../test-data';

export function getNameErrorDataList(options: {
  dtoData;
  purpose: TestPurpose;
}): TestErrorData[] {
  const { dtoData, purpose } = options;
  const property = 'name';
  const list = [
    TestData.buildErrorData({
      description: 'number',
      value: 2323232,
      property,
      data: dtoData,
      errors: { isString: NameMessage.STRING },
      message: { [property]: NameMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      value: true,
      property,
      data: dtoData,
      errors: { isString: NameMessage.STRING },
      message: { [property]: NameMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'array',
      value: [],
      property,
      data: dtoData,
      errors: { isString: NameMessage.STRING },
      message: { [property]: NameMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'object',
      value: {},
      property,
      data: dtoData,
      errors: { isString: NameMessage.STRING },
      message: { [property]: NameMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'too short',
      value: 'x'.repeat(5),
      property,
      data: dtoData,
      errors: { minLength: NameMessage.MIN_LEN },
      message: { [property]: NameMessage.MIN_LEN },
    }),
    TestData.buildErrorData({
      description: 'too long',
      value: 'x'.repeat(61),
      property,
      data: dtoData,
      errors: { maxLength: NameMessage.MAX_LEN },
      message: { [property]: NameMessage.MAX_LEN },
    }),
    TestData.buildErrorData({
      description: 'empty',
      value: '',
      property,
      data: dtoData,
      errors: { isNotEmpty: NameMessage.REQUIRED },
      message: { [property]: NameMessage.REQUIRED },
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
        errors: { isNotEmpty: NameMessage.REQUIRED },
        message: { [property]: NameMessage.REQUIRED },
      }),
      TestData.buildErrorData({
        description: 'undefined',
        property,
        value: undefined,
        data: dtoData,
        errors: { isNotEmpty: NameMessage.REQUIRED },
        message: { [property]: NameMessage.REQUIRED },
      }),
    );
  }
  return list;
}

export function getNameAcceptableValues(options: {
  dtoData;
  purpose: TestPurpose;
}): TestAcceptData[] {
  const { dtoData, purpose } = options;
  const property = 'name';
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
      // TestData.buildAcceptableValues({property,description: 'null', data: dtoData, value:null}),
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
