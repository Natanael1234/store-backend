import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export const validateFirstError = (data, dtoClass) => {
  const dto = plainToInstance(dtoClass, data);
  return validate(dto, { stopAtFirstError: true });
};

export const validateAllErrors = (data, dtoClass) => {
  const dto = plainToInstance(dtoClass, data);
  return validate(dto, { stopAtFirstError: false });
};
