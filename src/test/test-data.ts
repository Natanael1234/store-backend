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

  static getNameErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const list = [
      this.buildErrorData({
        description: 'number',
        data: { ...dtoData, name: 2323232 },
        errors: { isString: NameMessage.STRING },
        message: { name: NameMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, name: true },
        errors: { isString: NameMessage.STRING },
        message: { name: NameMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        data: { ...dtoData, name: [] },
        errors: { isString: NameMessage.STRING },
        message: { name: NameMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, name: {} },
        errors: { isString: NameMessage.STRING },
        message: { name: NameMessage.STRING },
      }),
      this.buildErrorData({
        description: 'too short',
        data: { ...dtoData, name: 'Usr' },
        errors: { minLength: NameMessage.MIN_LEN },
        message: { name: NameMessage.MIN_LEN },
      }),
      this.buildErrorData({
        description: 'too long',
        data: { ...dtoData, name: 'x'.repeat(61) },
        errors: { maxLength: NameMessage.MAX_LEN },
        message: { name: NameMessage.MAX_LEN },
      }),
      this.buildErrorData({
        description: 'empty',
        data: { ...dtoData, name: '' },
        errors: { isNotEmpty: NameMessage.REQUIRED },
        message: { name: NameMessage.REQUIRED },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          data: { ...dtoData, name: null },
          errors: { isNotEmpty: NameMessage.REQUIRED },
          message: { name: NameMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, name: undefined },
          errors: { isNotEmpty: NameMessage.REQUIRED },
          message: { name: NameMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getEmailErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const list = [
      this.buildErrorData({
        description: 'number',
        data: { ...dtoData, email: 2323232 },
        errors: { isString: EmailMessage.STRING },
        message: { email: EmailMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, email: true },
        errors: { isString: EmailMessage.STRING },
        message: { email: EmailMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        data: { ...dtoData, email: [] },
        errors: { isString: EmailMessage.STRING },
        message: { email: EmailMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, email: {} },
        errors: { isString: EmailMessage.STRING },
        message: { email: EmailMessage.STRING },
      }),
      this.buildErrorData({
        description: 'invalid',
        data: { ...dtoData, email: 'email.com' },
        errors: { isEmail: EmailMessage.INVALID },
        message: { email: EmailMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'empty',
        data: { ...dtoData, email: '' },
        errors: { isNotEmpty: EmailMessage.REQUIRED },
        message: { email: EmailMessage.REQUIRED },
      }),
      this.buildErrorData({
        description: 'too long',
        data: { ...dtoData, email: 'x'.repeat(55) + '@x.com' },
        errors: { maxLength: EmailMessage.MAX_LEN },
        message: { email: EmailMessage.MAX_LEN },
      }),
    ];

    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          description: 'null',
          data: { ...dtoData, email: null },
          errors: { isNotEmpty: EmailMessage.REQUIRED },
          message: { email: EmailMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, email: undefined },
          errors: { isNotEmpty: EmailMessage.REQUIRED },
          message: { email: EmailMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getPasswordErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const list = [
      this.buildErrorData({
        description: 'number',
        data: { ...dtoData, password: 2323232 },
        errors: { isString: PasswordMessage.STRING },
        message: { password: PasswordMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, password: true },
        errors: { isString: PasswordMessage.STRING },
        message: { password: PasswordMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        data: { ...dtoData, password: [] },
        errors: { isString: PasswordMessage.STRING },
        message: { password: PasswordMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, password: {} },
        errors: { isString: PasswordMessage.STRING },
        message: { password: PasswordMessage.STRING },
      }),
      this.buildErrorData({
        description: 'too short',
        data: { ...dtoData, password: 'Usr' },
        errors: { minLength: PasswordMessage.MIN_LEN },
        message: { password: PasswordMessage.MIN_LEN },
      }),
      this.buildErrorData({
        description: 'without uppercase letter',
        data: { ...dtoData, password: 'senha123*' },
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { password: PasswordMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'without lowercase letter',
        data: { ...dtoData, password: 'SENHA123*' },
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { password: PasswordMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'without number',
        data: { ...dtoData, password: 'SenhaABC*' },
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { password: PasswordMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'without special character',
        data: { ...dtoData, password: 'Senha123' },
        errors: { isStrongPassword: PasswordMessage.INVALID },
        message: { password: PasswordMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'empty',
        data: { ...dtoData, password: '' },
        errors: { isNotEmpty: PasswordMessage.REQUIRED },
        message: { password: PasswordMessage.REQUIRED },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          description: 'null',
          data: { ...dtoData, password: null },
          errors: { isNotEmpty: PasswordMessage.REQUIRED },
          message: { password: PasswordMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, password: undefined },
          errors: { isNotEmpty: PasswordMessage.REQUIRED },
          message: { password: PasswordMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getRolesErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const list = [
      this.buildErrorData({
        description: 'number',
        data: { ...dtoData, roles: 2323232 },
        errors: { isArray: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, roles: true },
        errors: { isArray: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, roles: {} },
        errors: { isArray: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'string',
        data: { ...dtoData, roles: 'string' },
        errors: { isArray: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'array containing invalid item',
        data: { ...dtoData, roles: ['invalid'] },
        errors: { isEnum: RoleMessage.INVALID },
        message: { roles: RoleMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'empty array',
        data: { ...dtoData, roles: [] },
        errors: { arrayMinSize: RoleMessage.MIN_LEN },
        message: { roles: RoleMessage.MIN_LEN },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          data: { ...dtoData, roles: null },
          errors: { isNotEmpty: RoleMessage.REQUIRED },
          message: { roles: RoleMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, roles: undefined },
          errors: { isNotEmpty: RoleMessage.REQUIRED },
          message: { roles: RoleMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getCodeErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const list = [
      this.buildErrorData({
        description: 'number',
        data: { ...dtoData, code: 2323232 },
        errors: { isString: CodeMessage.STRING },
        message: { code: CodeMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, code: true },
        errors: { isString: CodeMessage.STRING },
        message: { code: CodeMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        data: { ...dtoData, code: [] },
        errors: { isString: CodeMessage.STRING },
        message: { code: CodeMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, code: {} },
        errors: { isString: CodeMessage.STRING },
        message: { code: CodeMessage.STRING },
      }),
      this.buildErrorData({
        description: 'too short',
        data: { ...dtoData, code: 'Usr' },
        errors: { minLength: CodeMessage.MIN_LEN },
        message: { code: CodeMessage.MIN_LEN },
      }),
      this.buildErrorData({
        description: 'too long',
        data: { ...dtoData, code: 'x'.repeat(61) },
        errors: { maxLength: CodeMessage.MAX_LEN },
        message: { code: CodeMessage.MAX_LEN },
      }),
      this.buildErrorData({
        description: 'empty',
        data: { ...dtoData, code: '' },
        errors: { isNotEmpty: CodeMessage.REQUIRED },
        message: { code: CodeMessage.REQUIRED },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          data: { ...dtoData, code: null },
          errors: { isNotEmpty: CodeMessage.REQUIRED },
          message: { code: CodeMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, code: undefined },
          errors: { isNotEmpty: CodeMessage.REQUIRED },
          message: { code: CodeMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getModelErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const list = [
      this.buildErrorData({
        description: 'number',
        data: { ...dtoData, model: 2323232 },
        errors: { isString: ModelMessage.STRING },
        message: { model: ModelMessage.STRING },
      }),
      this.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, model: true },
        errors: { isString: ModelMessage.STRING },
        message: { model: ModelMessage.STRING },
      }),
      this.buildErrorData({
        description: 'array',
        data: { ...dtoData, model: [] },
        errors: { isString: ModelMessage.STRING },
        message: { model: ModelMessage.STRING },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, model: {} },
        errors: { isString: ModelMessage.STRING },
        message: { model: ModelMessage.STRING },
      }),
      this.buildErrorData({
        description: 'too short',
        data: { ...dtoData, model: 'Usr' },
        errors: { minLength: ModelMessage.MIN_LEN },
        message: { model: ModelMessage.MIN_LEN },
      }),
      this.buildErrorData({
        description: 'too long',
        data: { ...dtoData, model: 'x'.repeat(61) },
        errors: { maxLength: ModelMessage.MAX_LEN },
        message: { model: ModelMessage.MAX_LEN },
      }),
      this.buildErrorData({
        description: 'empty',
        data: { ...dtoData, model: '' },
        errors: { isNotEmpty: ModelMessage.REQUIRED },
        message: { model: ModelMessage.REQUIRED },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          // TODO: deveria ser testado na atualização?
          description: 'null',
          data: { ...dtoData, model: null },
          errors: { isNotEmpty: ModelMessage.REQUIRED },
          message: { model: ModelMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, model: undefined },
          errors: { isNotEmpty: ModelMessage.REQUIRED },
          message: { model: ModelMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getActiveErrorDataList(dtoData) {
    const list = [
      this.buildErrorData({
        description: 'number',
        data: { ...dtoData, active: 2323232 },
        errors: { isBoolean: ActiveMessage.BOOLEAN },
        message: { active: ActiveMessage.BOOLEAN },
      }),
      this.buildErrorData({
        description: 'array',
        data: { ...dtoData, active: [] },
        errors: { isBoolean: ActiveMessage.BOOLEAN },
        message: { active: ActiveMessage.BOOLEAN },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, active: {} },
        errors: { isBoolean: ActiveMessage.BOOLEAN },
        message: { active: ActiveMessage.BOOLEAN },
      }),
      this.buildErrorData({
        description: 'invalid',
        data: { ...dtoData, active: 'invalid' },
        errors: { isBoolean: ActiveMessage.BOOLEAN },
        message: { active: ActiveMessage.BOOLEAN },
      }),
    ];
    return list;
  }

  static getPriceErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const list = [
      this.buildErrorData({
        description: 'negative',
        data: { ...dtoData, price: -1 },
        errors: { min: PriceMessage.MIN },
        message: { price: PriceMessage.MIN },
      }),
      this.buildErrorData({
        description: 'string',
        data: { ...dtoData, price: '5' },
        errors: { isNumber: PriceMessage.NUMBER },
        message: { price: PriceMessage.MIN },
      }),
      this.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, price: true },
        errors: { isNumber: PriceMessage.NUMBER },
        message: { price: PriceMessage.MIN },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, price: {} },
        errors: { isNumber: PriceMessage.NUMBER },
        message: { price: PriceMessage.MIN },
      }),
      this.buildErrorData({
        description: 'array',
        data: { ...dtoData, price: [] },
        errors: { isNumber: PriceMessage.NUMBER },
        message: { price: PriceMessage.MIN },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, price: undefined },
          errors: { isNotEmpty: PriceMessage.REQUIRED },
          message: { price: PriceMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'null',
          data: { ...dtoData, price: null },
          errors: { isNotEmpty: PriceMessage.REQUIRED },
          message: { price: PriceMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getQuantityInStockErrorDataList(dtoData) {
    const list = [
      this.buildErrorData({
        description: 'negative',
        data: { ...dtoData, quantityInStock: -1 },
        errors: { min: ProductQuantityMessage.MIN },
        message: { quantityInStock: ProductQuantityMessage.MIN },
      }),
      this.buildErrorData({
        description: 'string',
        data: { ...dtoData, quantityInStock: '5' },
        errors: { isNumber: ProductQuantityMessage.NUMBER },
        message: { quantityInStock: ProductQuantityMessage.NUMBER },
      }),
      this.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, quantityInStock: true },
        errors: { isNumber: ProductQuantityMessage.NUMBER },
        message: { quantityInStock: ProductQuantityMessage.NUMBER },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, quantityInStock: {} },
        errors: { isNumber: ProductQuantityMessage.NUMBER },
        message: { quantityInStock: ProductQuantityMessage.NUMBER },
      }),
      this.buildErrorData({
        description: 'array',
        data: { ...dtoData, quantityInStock: [] },
        errors: { isNumber: ProductQuantityMessage.NUMBER },
        message: { quantityInStock: ProductQuantityMessage.NUMBER },
      }),
    ];
    return list;
  }

  static getBrandIdErrorDataList(
    dtoData,
    purpose: 'create' | 'register' | 'update',
  ) {
    const list = [
      this.buildErrorData({
        description: 'negative',
        data: { ...dtoData, brandId: -1 },
        errors: { min: BrandIdMessage.INVALID },
        message: { brandId: BrandIdMessage.INVALID },
      }),
      this.buildErrorData({
        description: 'float',
        data: { ...dtoData, brandId: 1.1 },
        errors: { isInt: BrandIdMessage.INT },
        message: { brandId: BrandIdMessage.INT },
      }),
      this.buildErrorData({
        description: 'string',
        data: { ...dtoData, brandId: '5' },
        errors: { isInt: BrandIdMessage.INT },
        message: { brandId: BrandIdMessage.INT },
      }),
      this.buildErrorData({
        description: 'boolean',
        data: { ...dtoData, brandId: true },
        errors: { isInt: BrandIdMessage.INT },
        message: { brandId: BrandIdMessage.INT },
      }),
      this.buildErrorData({
        description: 'object',
        data: { ...dtoData, brandId: {} },
        errors: { isInt: BrandIdMessage.INT },
        message: { brandId: BrandIdMessage.INT },
      }),
      this.buildErrorData({
        description: 'array',
        data: { ...dtoData, brandId: [] },
        errors: { isInt: BrandIdMessage.INT },
        message: { brandId: BrandIdMessage.INT },
      }),
    ];
    if (purpose != 'update') {
      list.push(
        this.buildErrorData({
          description: 'undefined',
          data: { ...dtoData, brandId: undefined },
          errors: { isNotEmpty: BrandIdMessage.REQUIRED },
          message: { brandId: BrandIdMessage.REQUIRED },
        }),
        this.buildErrorData({
          description: 'null',
          data: { ...dtoData, brandId: null },
          errors: { isNotEmpty: BrandIdMessage.REQUIRED },
          message: { brandId: BrandIdMessage.REQUIRED },
        }),
      );
    }
    return list;
  }

  static getNameAcceptableValues(dtoData) {
    const minLen = 'x'.repeat(6);
    const maxLen = 'x'.repeat(60);
    return [
      { description: 'min length', data: { ...dtoData, name: minLen } },
      { description: 'max length', data: { ...dtoData, name: maxLen } },
    ];
  }

  static getPasswordAcceptableValues(dtoData) {
    const minLen = 'Pwd12*';
    const maxLen = 'Pwd12*' + '123456';
    return [
      { descripttion: 'min length', data: { ...dtoData, password: minLen } },
      { descripttion: 'max length', data: { ...dtoData, password: maxLen } },
    ];
  }

  static getEmailAcceptableValues(dtoData) {
    const maxLen = 'x'.repeat(50) + '@email.com';
    return [{ description: 'max length', data: { ...dtoData, email: maxLen } }];
  }

  static getCodeAcceptableValues(dtoData) {
    const minLen = 'x'.repeat(6);
    const maxLen = 'x'.repeat(60);
    return [
      { description: 'min length', data: { ...dtoData, code: minLen } },
      { description: 'max length', data: { ...dtoData, code: maxLen } },
    ];
  }

  static getModelAcceptableValues(dtoData) {
    const minLen = 'x'.repeat(6);
    const maxLen = 'x'.repeat(60);
    return [
      { description: 'min length', data: { ...dtoData, model: minLen } },
      { description: 'max length', data: { ...dtoData, model: maxLen } },
    ];
  }

  static getActiveAcceptableValues(dtoData) {
    return [
      { description: 'boolean true', data: { ...dtoData, active: true } },
      { description: 'boolean false', data: { ...dtoData, active: false } },
      { description: 'string true', data: { ...dtoData, active: 'true' } },
      { description: 'string false', data: { ...dtoData, active: 'false' } },
      { description: 'null', data: { ...dtoData, active: null } },
      { description: 'undefined', data: { ...dtoData, active: undefined } },
    ];
  }

  static getPriceAcceptableValues(dtoData) {
    return [{ description: 'min value', data: { ...dtoData, price: 0 } }];
  }

  static getQuantityInStockAcceptableValues(dtoData) {
    return [
      { description: 'min value', data: { ...dtoData, quantityInStock: 0 } },
      { description: 'null', data: { ...dtoData, quantityInStock: null } },
      {
        description: 'undefined',
        data: { ...dtoData, quantityInStock: undefined },
      },
    ];
  }

  static getBrandIdAcceptableValues(dtoData) {
    return [{ description: 'min value', data: { ...dtoData, brandId: 1 } }];
  }
}
