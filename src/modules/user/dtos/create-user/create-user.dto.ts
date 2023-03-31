import {
  IsDefined,
  IsEmail,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { passwordValidationConfigs } from '../password-validation.configs';

export class CreateUserDTO {
  @IsDefined({ message: 'Name is required' })
  @MinLength(6, { message: 'Name must have at least 6 characters' })
  @MaxLength(60, { message: 'Name must be up to 60 characters' })
  name: string;
  @IsDefined({ message: 'Email is required' })
  @IsEmail(null, { message: 'Invalid email' })
  email: string;
  @IsDefined({ message: 'Password is required' })
  @IsStrongPassword(passwordValidationConfigs, { message: 'Password is weak' })
  password: string;

  // TODO:
  acceptTerms: boolean;
}
