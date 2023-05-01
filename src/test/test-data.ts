import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';

export type TestErrorOptions = {
  property: string;
  value: any;
  description: string;
  data: any;
  errors: any;
  message: any;
};

export type TestErrorData = {
  property: string;
  description: string;
  data: any;
  expectedErrors: any;
  exceptionName: string;
  exceptionMessage: string;
  ExceptionClass: any; // TODO: tipo
  statusCode: HttpStatus;
  response: {
    error: string;
    message: any;
    statusCode: HttpStatus;
  };
  exception: UnprocessableEntityException;
};

export type TestAcceptOptions = {
  property: string;
  description: string;
  data: any;
  value: any;
};

export type TestAcceptData = {
  property: string;
  description: string;
  data: any;
};

export enum TestPurpose {
  create = 'create',
  register = 'register',
  update = 'update',
}

export class TestData {
  public static buildErrorData(options: TestErrorOptions): TestErrorData {
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
      property,
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

  static buildAcceptableValues(options: TestAcceptOptions): TestAcceptData {
    const { property, description, data, value } = options;
    return { property, description, data: { ...data, [property]: value } };
  }
}
