import { IsStrongPasswordOptions } from 'class-validator';

export const passwordValidationConfigs: IsStrongPasswordOptions = {
  minLength: 6,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};
