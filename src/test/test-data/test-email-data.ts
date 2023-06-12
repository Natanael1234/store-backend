import { EmailMessage } from '../../modules/system/enums/messages/email-messages/email-messages.enum';
import {
  TestAcceptData,
  TestData,
  TestErrorData,
  TestPurpose,
} from '../test-data';

export function getEmailErrorDataList(options: {
  dtoData;
  purpose: TestPurpose;
}): TestErrorData[] {
  const property = 'email';
  const { dtoData, purpose } = options;
  const list = [
    TestData.buildErrorData({
      description: 'number',
      property,
      value: 2323232,
      data: dtoData,
      errors: { isString: EmailMessage.STRING },
      message: { [property]: EmailMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      property,
      value: true,
      data: dtoData,
      errors: { isString: EmailMessage.STRING },
      message: { [property]: EmailMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isString: EmailMessage.STRING },
      message: { [property]: EmailMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isString: EmailMessage.STRING },
      message: { [property]: EmailMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'invalid',
      property,
      value: 'email.com',
      data: dtoData,
      errors: { isEmail: EmailMessage.INVALID },
      message: { [property]: EmailMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'empty',
      property,
      value: '',
      data: dtoData,
      errors: { isNotEmpty: EmailMessage.REQUIRED },
      message: { [property]: EmailMessage.REQUIRED },
    }),
    TestData.buildErrorData({
      description: 'too long',
      property,
      value: 'x'.repeat(55) + '@x.com',
      data: dtoData,
      errors: { maxLength: EmailMessage.MAX_LEN },
      message: { [property]: EmailMessage.MAX_LEN },
    }),
  ];

  if (purpose != 'update') {
    list.push(
      TestData.buildErrorData({
        description: 'null',
        property,
        value: null,
        data: dtoData,
        errors: { isNotEmpty: EmailMessage.REQUIRED },
        message: { [property]: EmailMessage.REQUIRED },
      }),
      TestData.buildErrorData({
        description: 'undefined',
        property,
        value: undefined,
        data: dtoData,
        errors: { isNotEmpty: EmailMessage.REQUIRED },
        message: { [property]: EmailMessage.REQUIRED },
      }),
    );
  }
  return list;
}

export function getEmailAcceptableValues(options: {
  dtoData;
  purpose: TestPurpose;
}): TestAcceptData[] {
  const property = 'email';

  const { dtoData, purpose } = options;
  const maxLen = 'x'.repeat(50) + '@email.com';
  const list = [
    TestData.buildAcceptableValues({
      property,
      description: 'max length',
      data: dtoData,
      value: maxLen,
    }),
  ];
  if (purpose == 'update') {
    list.push(
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
    );
  }
  return list;
}
