import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { ExceptionText } from '../../messages/exception-text/exception-text.enum';

export const validateFirstError = async (data, dtoClass) => {
  const dto = plainToInstance(dtoClass, data);
  const validation = await validate(dto, { stopAtFirstError: true });
  return validation;
};
export const validateAllErrors = (data, dtoClass) => {
  const dto = plainToInstance(dtoClass, data);
  return validate(dto, { stopAtFirstError: false });
};

function getFirstConstraintValue(constraints?: { [type: string]: string }) {
  if (!constraints) {
    return null;
  }
  const values = Object.values(constraints);
  if (!values.length) {
    return null;
  }
  const value = Object.values(constraints)[0];
  return value;
}

function findFirstConstraintMessage(validationError: ValidationError) {
  if (validationError.constraints) {
    return getFirstConstraintValue(validationError.constraints);
  }
  if (validationError.children) {
    for (const validationErrorChild of validationError.children) {
      return findFirstConstraintMessage(validationErrorChild);
    }
  }
  return null;
}

export const convertValidationErrorsToMessage = (
  validationErrors: ValidationError[],
) => {
  const messages = {};
  for (const validationError of validationErrors) {
    messages[validationError.property] =
      findFirstConstraintMessage(validationError);
  }
  return messages;
};

export const validateOrThrowError = async (data, dtoClass) => {
  const errors = await validateFirstError(data, dtoClass);
  if (errors?.length) {
    const message = convertValidationErrorsToMessage(errors);
    const error = {
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    };
    const exception = new UnprocessableEntityException(error);
    throw exception;
  }
};
