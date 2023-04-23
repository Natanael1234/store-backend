import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { BrandIdMessage } from '../modules/stock/enums/brand-id-messages/brand-id-quantity-messages.enum';
import { CodeMessage } from '../modules/stock/enums/code-messages/code-messages.enum';
import { ModelMessage } from '../modules/stock/enums/model-messages/model-messages.enum';
import { PriceMessage } from '../modules/stock/enums/price-messages/price-messages.enum';
import { ProductQuantityMessage } from '../modules/stock/enums/quantity-messages/quantity-messages.enum';
import { ActiveMessage } from '../modules/system/enums/active-messages.ts/active-messages.enum';
import { EmailMessage } from '../modules/system/enums/email-messages/email-messages.enum';
import { NameMessage } from '../modules/system/enums/name-messages/name-messages.enum';
import { PasswordMessage } from '../modules/system/enums/password-messages/password-messages.enum';
import { RoleMessage } from '../modules/user/enums/role-messages/role-messages.enum';

export class TestData {
  public static buildErrorData(options: {
    property: string;
    value: any;
    description: string;
    data: any;
    errors: any;
    message: any;
  }) {
    let { property, value, description, data, errors, message } = options;
    data = { ...data, [property]: value };

    const expectedErrors = errors;
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

  static getNameErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'name';
    const list = [
      this.buildErrorData({
        description: 'number',
        value: 2323232,
        property,
        data: dtoData,
        errors: { isString: NameMessage.STRING },
        message: { [property]: NameMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        value: true,
        property,
        data: dtoData,
        errors: { isString: NameMessage.STRING },
        message: { [property]: NameMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        value: [],
        property,
        data: dtoData,
        errors: { isString: NameMessage.STRING },
        message: { [property]: NameMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        value: {},
        property,
        data: dtoData,
        errors: { isString: NameMessage.STRING },
        message: { [property]: NameMessage.STRING },
      }),
      this.buildErrorData({
        description: 'too short',
        value: 'x'.repeat(5),
        property,
        data: dtoData,
        errors: { minLength: NameMessage.MIN_LEN },
        message: { [property]: NameMessage.MIN_LEN },
      }),
      this.buildErrorData({
        description: 'too long',
        value: 'x'.repeat(61),
        property,
        data: dtoData,
        errors: { maxLength: NameMessage.MAX_LEN },
        message: { [property]: NameMessage.MAX_LEN },
      }),
      this.buildErrorData({
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
        this.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          property,
          value: null,
          data: dtoData,
          errors: { isNotEmpty: NameMessage.REQUIRED },
          message: { [property]: NameMessage.REQUIRED },
        }),
        this.buildErrorData({
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

  static getEmailErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'email';
    const list = [
      this.buildErrorData({
        description: 'number',
        property,
        value: 2323232,
        data: dtoData,
        errors: { isString: EmailMessage.STRING },
        message: { [property]: EmailMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        property,
        value: true,
        data: dtoData,
        errors: { isString: EmailMessage.STRING },
        message: { [property]: EmailMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        property,
        value: [],
        data: dtoData,
        errors: { isString: EmailMessage.STRING },
        message: { [property]: EmailMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        property,
        value: {},
        data: dtoData,
        errors: { isString: EmailMessage.STRING },
        message: { [property]: EmailMessage.STRING },
      }),
      this.buildErrorData({
        description: 'invalid',
        property,
        value: 'email.com',
        data: dtoData,
        errors: { isEmail: EmailMessage.INVALID },
        message: { [property]: EmailMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'empty',
        property,
        value: '',
        data: dtoData,
        errors: { isNotEmpty: EmailMessage.REQUIRED },
        message: { [property]: EmailMessage.REQUIRED },
      }),
      this.buildErrorData({
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
        this.buildErrorData({
          description: 'null',
          property,
          value: null,
          data: dtoData,
          errors: { isNotEmpty: EmailMessage.REQUIRED },
          message: { [property]: EmailMessage.REQUIRED },
        }),
        this.buildErrorData({
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

  static getPasswordErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'password';
    const list = [
      this.buildErrorData({
        description: 'number',
        property,
        value: 2323232,
        data: dtoData,
        errors: { isString: PasswordMessage.STRING },
        message: { [property]: PasswordMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        property,
        value: true,
        data: dtoData,
        errors: { isString: PasswordMessage.STRING },
        message: { [property]: PasswordMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        property,
        value: [],
        data: dtoData,
        errors: { isString: PasswordMessage.STRING },
        message: { [property]: PasswordMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        property,
        value: {},
        data: dtoData,
        errors: { isString: PasswordMessage.STRING },
        message: { [property]: PasswordMessage.STRING },
      }),
      this.buildErrorData({
        description: 'too short',
        property,
        value: 'Pwd*1',
        data: dtoData,
        errors: { minLength: PasswordMessage.MIN_LEN },
        message: { [property]: PasswordMessage.MIN_LEN },
      }),
      this.buildErrorData({
        description: 'without uppercase letter',
        property,
        value: 'senha123*',
        data: dtoData,
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { [property]: PasswordMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'without lowercase letter',
        property,
        value: 'SENHA123*',
        data: dtoData,
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { [property]: PasswordMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'without number',
        property,
        value: 'SenhaABC*',
        data: dtoData,
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { [property]: PasswordMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'without special character',
        property,
        value: 'Senha123',
        data: dtoData,
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { [property]: PasswordMessage.INVALID },
      }),
      this.buildErrorData({
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
        this.buildErrorData({
          description: 'null',
          property,
          value: null,
          data: dtoData,
          errors: { isNotEmpty: PasswordMessage.REQUIRED },
          message: { [property]: PasswordMessage.REQUIRED },
        }),
        this.buildErrorData({
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

  static getRolesErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'roles';
    const list = [
      this.buildErrorData({
        description: 'number',
        property,
        value: 2323232,
        data: dtoData,
        errors: { isArray: RoleMessage.INVALID },
        message: { [property]: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'boolean',
        property,
        value: true,
        data: dtoData,
        errors: { isArray: RoleMessage.INVALID },
        message: { [property]: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'object',
        property,
        value: {},
        data: dtoData,
        errors: { isArray: RoleMessage.INVALID },
        message: { [property]: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'string',
        property,
        value: 'string',
        data: dtoData,
        errors: { isArray: RoleMessage.INVALID },
        message: { [property]: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'array containing invalid item',
        property,
        value: ['invalid'],
        data: dtoData,
        errors: { isEnum: RoleMessage.INVALID },
        message: { [property]: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'empty array',
        property,
        value: [],
        data: dtoData,
        errors: { arrayMinSize: RoleMessage.MIN_LEN },
        message: { [property]: RoleMessage.MIN_LEN },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          property,
          value: null,
          data: dtoData,
          errors: { isNotEmpty: RoleMessage.REQUIRED },
          message: { [property]: RoleMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'undefined',
          property,
          value: undefined,
          data: dtoData,
          errors: { isNotEmpty: RoleMessage.REQUIRED },
          message: { [property]: RoleMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getCodeErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'code';
    const list = [
      this.buildErrorData({
        description: 'number',
        property,
        value: 2323232,
        data: dtoData,
        errors: { isString: CodeMessage.STRING },
        message: { [property]: CodeMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        property,
        value: true,
        data: dtoData,
        errors: { isString: CodeMessage.STRING },
        message: { [property]: CodeMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        property,
        value: [],
        data: dtoData,
        errors: { isString: CodeMessage.STRING },
        message: { [property]: CodeMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        property,
        value: {},
        data: dtoData,
        errors: { isString: CodeMessage.STRING },
        message: { [property]: CodeMessage.STRING },
      }),
      this.buildErrorData({
        description: 'too short',
        property,
        value: 'x'.repeat(5),
        data: dtoData,
        errors: { minLength: CodeMessage.MIN_LEN },
        message: { [property]: CodeMessage.MIN_LEN },
      }),
      this.buildErrorData({
        description: 'too long',
        property,
        value: 'x'.repeat(61),
        data: dtoData,
        errors: { maxLength: CodeMessage.MAX_LEN },
        message: { [property]: CodeMessage.MAX_LEN },
      }),
      this.buildErrorData({
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
        this.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          property,
          value: null,
          data: dtoData,
          errors: { isNotEmpty: CodeMessage.REQUIRED },
          message: { [property]: CodeMessage.REQUIRED },
        }),
        this.buildErrorData({
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

  static getModelErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'model';
    const list = [
      this.buildErrorData({
        description: 'number',
        property,
        value: 2323232,
        data: dtoData,
        errors: { isString: ModelMessage.STRING },
        message: { [property]: ModelMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        property,
        value: true,
        data: dtoData,
        errors: { isString: ModelMessage.STRING },
        message: { [property]: ModelMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        property,
        value: [],
        data: dtoData,
        errors: { isString: ModelMessage.STRING },
        message: { [property]: ModelMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        property,
        value: {},
        data: dtoData,
        errors: { isString: ModelMessage.STRING },
        message: { [property]: ModelMessage.STRING },
      }),
      this.buildErrorData({
        description: 'too short',
        property,
        value: 'x'.repeat(5),
        data: dtoData,
        errors: { minLength: ModelMessage.MIN_LEN },
        message: { [property]: ModelMessage.MIN_LEN },
      }),
      this.buildErrorData({
        description: 'too long',
        property,
        value: 'x'.repeat(61),
        data: dtoData,
        errors: { maxLength: ModelMessage.MAX_LEN },
        message: { [property]: ModelMessage.MAX_LEN },
      }),
      this.buildErrorData({
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
        this.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          property,
          value: null,
          data: dtoData,
          errors: { isNotEmpty: ModelMessage.REQUIRED },
          message: { [property]: ModelMessage.REQUIRED },
        }),
        this.buildErrorData({
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

  static getActiveErrorDataList(dtoData) {
    const property = 'active';
    const list = [
      this.buildErrorData({
        description: 'number',
        property,
        value: 2323232,
        data: dtoData,
        errors: { isBoolean: ActiveMessage.BOOLEAN },
        message: { [property]: ActiveMessage.BOOLEAN },
      }),
      this.buildErrorData({
        description: 'array',
        property,
        value: [],
        data: dtoData,
        errors: { isBoolean: ActiveMessage.BOOLEAN },
        message: { [property]: ActiveMessage.BOOLEAN },
      }),
      this.buildErrorData({
        description: 'object',
        property,
        value: {},
        data: dtoData,
        errors: { isBoolean: ActiveMessage.BOOLEAN },
        message: { [property]: ActiveMessage.BOOLEAN },
      }),
      this.buildErrorData({
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

  static getPriceErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'price';
    const list = [
      this.buildErrorData({
        description: 'negative',
        property,
        value: -1,
        data: dtoData,
        errors: { min: PriceMessage.MIN },
        message: { [property]: PriceMessage.MIN },
      }),
      this.buildErrorData({
        description: 'string',
        property,
        value: '5',
        data: dtoData,
        errors: { isNumber: PriceMessage.NUMBER },
        message: { [property]: PriceMessage.NUMBER },
      }),
      this.buildErrorData({
        description: 'boolean',
        property,
        value: true,
        data: dtoData,
        errors: { isNumber: PriceMessage.NUMBER },
        message: { [property]: PriceMessage.NUMBER },
      }),
      this.buildErrorData({
        description: 'object',
        property,
        value: {},
        data: dtoData,
        errors: { isNumber: PriceMessage.NUMBER },
        message: { [property]: PriceMessage.NUMBER },
      }),
      this.buildErrorData({
        description: 'array',
        property,
        value: [],
        data: dtoData,
        errors: { isNumber: PriceMessage.NUMBER },
        message: { [property]: PriceMessage.NUMBER },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          description: 'undefined',
          property,
          value: undefined,
          data: dtoData,
          errors: { isNotEmpty: PriceMessage.REQUIRED },
          message: { [property]: PriceMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'null',
          property,
          value: null,
          data: dtoData,
          errors: { isNotEmpty: PriceMessage.REQUIRED },
          message: { [property]: PriceMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getQuantityInStockErrorDataList(dtoData) {
    const property = 'quantityInStock';
    const list = [
      this.buildErrorData({
        description: 'negative',
        property,
        value: -1,
        data: dtoData,
        errors: { min: ProductQuantityMessage.MIN },
        message: { [property]: ProductQuantityMessage.MIN },
      }),
      this.buildErrorData({
        description: 'string',
        property,
        value: '5',
        data: dtoData,
        errors: { isNumber: ProductQuantityMessage.NUMBER },
        message: { [property]: ProductQuantityMessage.NUMBER },
      }),
      this.buildErrorData({
        description: 'boolean',
        property,
        value: true,
        data: dtoData,
        errors: { isNumber: ProductQuantityMessage.NUMBER },
        message: { [property]: ProductQuantityMessage.NUMBER },
      }),
      this.buildErrorData({
        description: 'object',
        property,
        value: {},
        data: dtoData,
        errors: { isNumber: ProductQuantityMessage.NUMBER },
        message: { [property]: ProductQuantityMessage.NUMBER },
      }),
      this.buildErrorData({
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

  static getBrandIdErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'brandId';
    const list = [
      this.buildErrorData({
        description: 'negative',
        property,
        value: -1,
        data: dtoData,
        errors: { min: BrandIdMessage.INVALID },
        message: { [property]: BrandIdMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'float',
        property,
        value: 1.1,
        data: dtoData,
        errors: { isInt: BrandIdMessage.INT },
        message: { [property]: BrandIdMessage.INT },
      }),
      this.buildErrorData({
        description: 'string',
        property,
        value: '5',
        data: dtoData,
        errors: { isInt: BrandIdMessage.INT },
        message: { [property]: BrandIdMessage.INT },
      }),
      this.buildErrorData({
        description: 'boolean',
        property,
        value: true,
        data: dtoData,
        errors: { isInt: BrandIdMessage.INT },
        message: { [property]: BrandIdMessage.INT },
      }),
      this.buildErrorData({
        description: 'object',
        property,
        value: {},
        data: dtoData,
        errors: { isInt: BrandIdMessage.INT },
        message: { [property]: BrandIdMessage.INT },
      }),
      this.buildErrorData({
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
        this.buildErrorData({
          description: 'undefined',
          property,
          value: undefined,
          data: dtoData,
          errors: { isNotEmpty: BrandIdMessage.REQUIRED },
          message: { [property]: BrandIdMessage.REQUIRED },
        }),
        this.buildErrorData({
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

  static buildAcceptableValues(
    property: string,
    description: string,
    data: any,
    value: any,
  ) {
    return { property, description, data: { ...data, [property]: value } };
  }

  static getNameAcceptableValues(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'name';
    const minLen = 'x'.repeat(6);
    const maxLen = 'x'.repeat(60);
    const list = [
      this.buildAcceptableValues(property, 'min length', dtoData, minLen),
      this.buildAcceptableValues(property, 'max length', dtoData, maxLen),
    ];
    if (purpose == 'update') {
      list.push(
        // this.buildAcceptableValues(property, 'null', dtoData, null),
        this.buildAcceptableValues(property, 'undefined', dtoData, undefined),
      );
    }
    return list;
  }

  static getPasswordAcceptableValues(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'password';
    const minLen = 'Pwd12*';
    const maxLen = 'Pwd12*' + '123456';
    const list = [
      this.buildAcceptableValues(property, 'min length', dtoData, minLen),
      this.buildAcceptableValues(property, 'max length', dtoData, maxLen),
    ];
    if (purpose == 'update') {
      list.push(
        this.buildAcceptableValues(property, 'null', dtoData, null),
        this.buildAcceptableValues(property, 'undefined', dtoData, undefined),
      );
    }
    return list;
  }

  static getEmailAcceptableValues(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'email';
    const maxLen = 'x'.repeat(50) + '@email.com';
    const list = [
      this.buildAcceptableValues(property, 'max length', dtoData, maxLen),
    ];
    if (purpose == 'update') {
      list.push(
        this.buildAcceptableValues(property, 'null', dtoData, null),
        this.buildAcceptableValues(property, 'undefined', dtoData, undefined),
      );
    }
    return list;
  }

  static getCodeAcceptableValues(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'code';
    const minLen = 'x'.repeat(6);
    const maxLen = 'x'.repeat(60);
    const list = [
      this.buildAcceptableValues(property, 'min length', dtoData, minLen),
      this.buildAcceptableValues(property, 'max length', dtoData, maxLen),
    ];
    if (purpose == 'update') {
      list.push(
        // this.buildAcceptableValues(property, 'null', dtoData, null),
        this.buildAcceptableValues(property, 'undefined', dtoData, undefined),
      );
    }
    return list;
  }

  static getModelAcceptableValues(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'model';
    const minLen = 'x'.repeat(6);
    const maxLen = 'x'.repeat(60);
    const list = [
      this.buildAcceptableValues(property, 'min length', dtoData, minLen),
      this.buildAcceptableValues(property, 'max length', dtoData, maxLen),
    ];
    if (purpose == 'update') {
      list.push(
        // this.buildAcceptableValues(property, 'null', dtoData, null),
        this.buildAcceptableValues(property, 'undefined', dtoData, undefined),
      );
    }
    return list;
  }

  static getActiveAcceptableValues(dtoData) {
    const property = 'active';
    const list = [
      this.buildAcceptableValues(property, 'boolean true', dtoData, true),
      this.buildAcceptableValues(property, 'boolean false', dtoData, false),
      this.buildAcceptableValues(property, 'string true', dtoData, 'true'),
      this.buildAcceptableValues(property, 'string false', dtoData, 'false'),
      this.buildAcceptableValues(property, 'null', dtoData, null),
      this.buildAcceptableValues(property, 'undefined', dtoData, undefined),
    ];
    return list;
  }

  static getPriceAcceptableValues(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'price';
    const list = [
      this.buildAcceptableValues(property, 'min value', dtoData, 0),
    ];
    if (purpose == 'update') {
      list.push(
        // this.buildAcceptableValues(property, 'null', dtoData, null),
        this.buildAcceptableValues(property, 'undefined', dtoData, undefined),
      );
    }
    return list;
  }

  static getQuantityInStockAcceptableValues(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'quantityInStock';
    const list = [
      this.buildAcceptableValues(property, 'min value', dtoData, 0),
      // this.buildAcceptableValues(property, 'null', dtoData, null),
      this.buildAcceptableValues(property, 'undefined', dtoData, undefined),
    ];
    return list;
  }

  static getBrandIdAcceptableValues(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const property = 'brandId';
    const list = [
      this.buildAcceptableValues(property, 'min value', dtoData, 1),
    ];
    if (purpose == 'update') {
      list.push(
        // this.buildAcceptableValues(property, 'null', dtoData, null),
        this.buildAcceptableValues(property, 'undefined', dtoData, undefined),
      );
    }
    return list;
  }
}
