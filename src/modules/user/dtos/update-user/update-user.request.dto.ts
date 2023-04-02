import {
  IsDefined,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserRequestDTO {
  @IsDefined({ message: 'Id is required' })
  id: number;

  @MaxLength(60, { message: 'Name must be up to 60 characters' })
  @MinLength(6, { message: 'Name must have at least 6 characters' })
  @IsString({ message: 'Email must be string' })
  @IsOptional()
  name?: string;

  @IsEmail(null, { message: 'Invalid email' })
  @IsString({ message: 'Email must be string' })
  @IsOptional()
  email?: string;
}
