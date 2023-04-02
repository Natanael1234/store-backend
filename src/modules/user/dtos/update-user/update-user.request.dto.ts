import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  isNotEmpty,
} from 'class-validator';

export class UpdateUserRequestDTO {
  @MaxLength(60, { message: 'Name must have a maximum of 60 characters' })
  @MinLength(6, { message: 'Name must be at least 6 characters long' })
  @IsString({ message: 'Name must be string' })
  @IsOptional()
  name?: string;

  @MaxLength(60, {
    message: 'Email must have a maximum of 60 characters',
  })
  @IsEmail({}, { message: 'Invalid email' })
  @IsString({ message: 'Email must be string' })
  @IsOptional()
  email?: string;
}
