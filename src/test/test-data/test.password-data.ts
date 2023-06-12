import { PasswordMessage } from '../../modules/system/enums/messages/password-messages/password-messages.enum';
import {
  TestAcceptData,
  TestData,
  TestErrorData,
  TestPurpose,
} from '../test-data';

export function getPasswordErrorDataList(options: {
  dtoData;
  purpose: TestPurpose;
}): TestErrorData[] {
  const property = 'password';
  const { purpose, dtoData } = options;
  const list = [
    TestData.buildErrorData({
      description: 'number',
      property,
      value: 2323232,
      data: dtoData,
      errors: { isString: PasswordMessage.STRING },
      message: { [property]: PasswordMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      property,
      value: true,
      data: dtoData,
      errors: { isString: PasswordMessage.STRING },
      message: { [property]: PasswordMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'array',
      property,
      value: [],
      data: dtoData,
      errors: { isString: PasswordMessage.STRING },
      message: { [property]: PasswordMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isString: PasswordMessage.STRING },
      message: { [property]: PasswordMessage.STRING },
    }),
    TestData.buildErrorData({
      description: 'too short',
      property,
      value: 'Pwd*1',
      data: dtoData,
      errors: { minLength: PasswordMessage.MIN_LEN },
      message: { [property]: PasswordMessage.MIN_LEN },
    }),
    TestData.buildErrorData({
      description: 'without uppercase letter',
      property,
      value: 'senha123*',
      data: dtoData,
      errors: { isStrongPassword: PasswordMessage.INVALID },
      message: { [property]: PasswordMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'without lowercase letter',
      property,
      value: 'SENHA123*',
      data: dtoData,
      errors: { isStrongPassword: PasswordMessage.INVALID },
      message: { [property]: PasswordMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'without number',
      property,
      value: 'SenhaABC*',
      data: dtoData,
      errors: { isStrongPassword: PasswordMessage.INVALID },
      message: { [property]: PasswordMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'without special character',
      property,
      value: 'Senha123',
      data: dtoData,
      errors: { isStrongPassword: PasswordMessage.INVALID },
      message: { [property]: PasswordMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'empty',
      property,
      value: '',
      data: dtoData,
      errors: { isNotEmpty: PasswordMessage.REQUIRED },
      message: { [property]: PasswordMessage.REQUIRED },
    }),
  ];
  if (purpose != 'update') {
    list.push(
      TestData.buildErrorData({
        description: 'null',
        property,
        value: null,
        data: dtoData,
        errors: { isNotEmpty: PasswordMessage.REQUIRED },
        message: { [property]: PasswordMessage.REQUIRED },
      }),
      TestData.buildErrorData({
        description: 'undefined',
        property,
        value: undefined,
        data: dtoData,
        errors: { isNotEmpty: PasswordMessage.REQUIRED },
        message: { [property]: PasswordMessage.REQUIRED },
      }),
    );
  }
  return list;
}

export function getPasswordAcceptableValues(options: {
  dtoData;
  purpose: TestPurpose;
}): TestAcceptData[] {
  const property = 'password';
  const { purpose, dtoData } = options;
  const minLen = 'Pwd12*';
  const maxLen = 'Pwd12*' + '123456';
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
