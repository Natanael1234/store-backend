import { UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';

export const validateFirstError = (data, dtoClass) => {
  const dto = plainToInstance(dtoClass, data);
  return validate(dto, { stopAtFirstError: true });
};

export const validateAllErrors = (data, dtoClass) => {
  const dto = plainToInstance(dtoClass, data);
  return validate(dto, { stopAtFirstError: false });
};

export const validateAndThrows = async (data, dtoClass) => {
  const errors = await validateFirstError(data, dtoClass);
  if (errors?.length) {
    const contraints = errors.map((error) => error.constraints);
    throw new UnprocessableEntityException(errors);
  }
};
