import { UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';

export const validateFirstError = async (data, dtoClass) => {
  const dto = plainToInstance(dtoClass, data);
  const validation = await validate(dto, { stopAtFirstError: true });
  return validation;
};
export const validateAllErrors = (data, dtoClass) => {
  const dto = plainToInstance(dtoClass, data);
  return validate(dto, { stopAtFirstError: false });
};

export const convertValidationErrorsToMessage = (
  validationErrors: ValidationError[],
) => {
  const message = {};
  for (const validationError of validationErrors) {
    // validationError.constraints = {};
    message[validationError.property] = Object.values(
      validationError.constraints,
    )[0];
    // TODO: handler children
  }
  return message;
};

export const validateOrThrowError = async (data, dtoClass) => {
  const errors = await validateFirstError(data, dtoClass);
  if (errors?.length) {
    const message = convertValidationErrorsToMessage(errors);
    const error = {
      error: UnprocessableEntityException.name,
      message,
      statusCode: 422,
    };
    const exception = new UnprocessableEntityException(error);
    throw exception;
  }
};
