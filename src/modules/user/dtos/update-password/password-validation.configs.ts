import { IsStrongPasswordOptions } from 'class-validator';
import { UserConfigs } from '../../configs/user/user.configs';

const { PASSWORD_MIN_LENGTH } = UserConfigs;

export const passwordValidationConfigs: IsStrongPasswordOptions = {
  minLength: PASSWORD_MIN_LENGTH,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};
