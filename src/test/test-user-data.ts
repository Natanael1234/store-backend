import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { Role } from '../modules/authentication/enums/role/role.enum';
import { EmailMessage } from '../modules/user/enums/email-messages/email-messages.enum';
import { NameMessage } from '../modules/user/enums/name-messages/name-messages.enum';
import { PasswordMessage } from '../modules/user/enums/password-messages/password-messages.enum';
import { RoleMessage } from '../modules/user/enums/role-messages/role-messages.enum';

export class TestUserData {
  /** service/api */
  static get userCreationData() {
    return [
      {
        name: 'User 1',
        password: 'Abc12*',
        email: 'user1@email.com',
        roles: [Role.ROOT],
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.USER],
      },
      {
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.ADMIN],
      },
    ];
  }

  static get usersUpdateData() {
    return TestUserData.userCreationData.map((data) => {
      const { name, email } = data;
      return { name, email };
    });
  }

  /** service/api */
  static get registerData(): {
    name: string;
    email: string;
    password: string;
    acceptTerms: true;
  }[] {
    return TestUserData.userCreationData.map((createUserData) => {
      const { name, email, password } = createUserData;
      return { name, email, password, acceptTerms: true };
    });
  }

  /** repository */
  static usersData(options?: { passwords: boolean }) {
    return TestUserData.userCreationData.map((createUserData) => {
      if (options?.passwords === false) {
        delete options.passwords;
      }
      return {
        ...createUserData,
        hash: { iv: 'x', encryptedData: 'y' },
      };
    });
  }

  private static buildErrorData(options: {
    description: string;
    data: any;
    errors: any;
    message: any;
  }) {
    const description = options.description;
    const data = options.data;
    const message = options.message;
    const expectedErrors = options.errors;
    const statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    const ExceptionClass = UnprocessableEntityException;
    const error = ExceptionClass.name;
    const exceptionName = ExceptionClass.name;
    const exceptionMessage = ExceptionClass.constructor.name;
    const response = { error, message, statusCode };
    const exception = new ExceptionClass(response);
    return {
      description,
      data,
      expectedErrors,
      exceptionName,
      exceptionMessage,
      ExceptionClass,
      statusCode,
      response,
      exception,
    };
  }

  private static getUsersData(purpose: 'create' | 'register' | 'update') {
    if (purpose == 'create') {
      return TestUserData.userCreationData;
    } else if (purpose == 'register') {
      return TestUserData.registerData;
    } else {
      return TestUserData.usersUpdateData;
    }
  }

  static getNameErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = TestUserData.getUsersData(purpose)[2];
    const list = [
      TestUserData.buildErrorData({
        description: 'number',
        data: { ...dtoData, name: 2323232 },
        errors: { isString: NameMessage.STRING },
        message: { name: NameMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, name: true },
        errors: { isString: NameMessage.STRING },
        message: { name: NameMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'array',
        data: { ...dtoData, name: [] },
        errors: { isString: NameMessage.STRING },
        message: { name: NameMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'object',
        data: { ...dtoData, name: {} },
        errors: { isString: NameMessage.STRING },
        message: { name: NameMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'too short',
        data: { ...dtoData, name: 'Usr' },
        errors: { minLength: NameMessage.MIN_LEN },
        message: { name: NameMessage.MIN_LEN },
      }),
      TestUserData.buildErrorData({
        description: 'too long',
        data: { ...dtoData, name: 'x'.repeat(61) },
        errors: { maxLength: NameMessage.MAX_LEN },
        message: { name: NameMessage.MAX_LEN },
      }),
      TestUserData.buildErrorData({
        description: 'empty',
        data: { ...dtoData, name: '' },
        errors: { isNotEmpty: NameMessage.REQUIRED },
        message: { name: NameMessage.REQUIRED },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        TestUserData.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          data: { ...dtoData, name: null },
          errors: { isNotEmpty: NameMessage.REQUIRED },
          message: { name: NameMessage.REQUIRED },
        }),
        TestUserData.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, name: undefined },
          errors: { isNotEmpty: NameMessage.REQUIRED },
          message: { name: NameMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getEmailErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = TestUserData.getUsersData(purpose)[2];
    const list = [
      TestUserData.buildErrorData({
        description: 'number',
        data: { ...dtoData, email: 2323232 },
        errors: { isString: EmailMessage.STRING },
        message: { email: EmailMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, email: true },
        errors: { isString: EmailMessage.STRING },
        message: { email: EmailMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'array',
        data: { ...dtoData, email: [] },
        errors: { isString: EmailMessage.STRING },
        message: { email: EmailMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'object',
        data: { ...dtoData, email: {} },
        errors: { isString: EmailMessage.STRING },
        message: { email: EmailMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'invalid',
        data: { ...dtoData, email: 'email.com' },
        errors: { isEmail: EmailMessage.INVALID },
        message: { email: EmailMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'empty',
        data: { ...dtoData, email: '' },
        errors: { isNotEmpty: EmailMessage.REQUIRED },
        message: { email: EmailMessage.REQUIRED },
      }),
      TestUserData.buildErrorData({
        description: 'too long',
        data: { ...dtoData, email: 'x'.repeat(55) + '@x.com' },
        errors: { maxLength: EmailMessage.MAX_LEN },
        message: { email: EmailMessage.MAX_LEN },
      }),
    ];

    if (purpose != 'update') {
      list.push(
        TestUserData.buildErrorData({
          description: 'null',
          data: { ...dtoData, email: null },
          errors: { isNotEmpty: EmailMessage.REQUIRED },
          message: { email: EmailMessage.REQUIRED },
        }),
        TestUserData.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, email: undefined },
          errors: { isNotEmpty: EmailMessage.REQUIRED },
          message: { email: EmailMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getPasswordErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = TestUserData.getUsersData(purpose)[2];
    const list = [
      TestUserData.buildErrorData({
        description: 'number',
        data: { ...dtoData, password: 2323232 },
        errors: { isString: PasswordMessage.STRING },
        message: { password: PasswordMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, password: true },
        errors: { isString: PasswordMessage.STRING },
        message: { password: PasswordMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'array',
        data: { ...dtoData, password: [] },
        errors: { isString: PasswordMessage.STRING },
        message: { password: PasswordMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'object',
        data: { ...dtoData, password: {} },
        errors: { isString: PasswordMessage.STRING },
        message: { password: PasswordMessage.STRING },
      }),
      TestUserData.buildErrorData({
        description: 'too short',
        data: { ...dtoData, password: 'Usr' },
        errors: { minLength: PasswordMessage.MIN_LEN },
        message: { password: PasswordMessage.MIN_LEN },
      }),
      TestUserData.buildErrorData({
        description: 'without uppercase letter',
        data: { ...dtoData, password: 'senha123*' },
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { password: PasswordMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'without lowercase letter',
        data: { ...dtoData, password: 'SENHA123*' },
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { password: PasswordMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'without number',
        data: { ...dtoData, password: 'SenhaABC*' },
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { password: PasswordMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'without special character',
        data: { ...dtoData, password: 'Senha123' },
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { password: PasswordMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'empty',
        data: { ...dtoData, password: '' },
        errors: { isNotEmpty: PasswordMessage.REQUIRED },
        message: { password: PasswordMessage.REQUIRED },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        TestUserData.buildErrorData({
          description: 'null',
          data: { ...dtoData, password: null },
          errors: { isNotEmpty: PasswordMessage.REQUIRED },
          message: { password: PasswordMessage.REQUIRED },
        }),
        TestUserData.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, password: undefined },
          errors: { isNotEmpty: PasswordMessage.REQUIRED },
          message: { password: PasswordMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getRolesErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = TestUserData.getUsersData(purpose)[2];
    const list = [
      TestUserData.buildErrorData({
        description: 'number',
        data: { ...dtoData, roles: 2323232 },
        errors: { isArray: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, roles: true },
        errors: { isArray: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'object',
        data: { ...dtoData, roles: {} },
        errors: { isArray: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'string',
        data: { ...dtoData, roles: 'string' },
        errors: { isArray: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'array containing invalid item',
        data: { ...dtoData, roles: ['invalid'] },
        errors: { isEnum: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      TestUserData.buildErrorData({
        description: 'empty array',
        data: { ...dtoData, roles: [] },
        errors: { arrayMinSize: RoleMessage.MIN_LEN },
        message: { roles: RoleMessage.MIN_LEN },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        TestUserData.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          data: { ...dtoData, roles: null },
          errors: { isNotEmpty: RoleMessage.REQUIRED },
          message: { roles: RoleMessage.REQUIRED },
        }),
        TestUserData.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, roles: undefined },
          errors: { isNotEmpty: RoleMessage.REQUIRED },
          message: { roles: RoleMessage.REQUIRED },
        }),
      );
    }
    return list;
  }
}
