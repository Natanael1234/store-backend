import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginRequestDto {
  @MaxLength(60, {
    message: 'Email must have a maximum of 60 characters',
  })
  @IsEmail({}, { message: 'Email is invalid' })
  @IsString({ message: 'Email must be string' })
  @IsNotEmpty({ message: 'Email is required' })
  readonly email: string;

  @MaxLength(60, { message: 'Password must have a maximum of 60 characters' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  readonly password: string;
}
