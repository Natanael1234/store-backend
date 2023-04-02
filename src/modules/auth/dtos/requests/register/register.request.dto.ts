import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterRequestDto {
  @MaxLength(60, {
    message: 'Name must have a maximum of 60 characters',
  })
  @MinLength(6, { message: 'Name must be at least 6 characters long' })
  @IsString({ message: 'Name must be string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @MaxLength(60, {
    message: 'Email must have a maximum of 60 characters',
  })
  @IsEmail({}, { message: 'Invalid email' })
  @IsString({ message: 'Email must be string' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsStrongPassword(
    {
      minLength: 3,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    {
      message:
        'Password must have lowercase, uppercase, number and special characters',
    },
  )
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(12, {
    message: 'Password must have a maximum of 12 characters',
  })
  @IsString({ message: 'Password must be string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @Equals(true, { message: 'Acceptance of terms is required' })
  @Transform(({ value }) => {
    if (typeof value == 'string') {
      return value.toLowerCase() === 'true';
    } else if (value === true) {
      return true;
    }
    return false;
  })
  acceptTerms: boolean;
}
