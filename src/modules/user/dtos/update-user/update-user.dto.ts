import {
  IsDefined,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDTO {
  @IsDefined({
    message: 'Id is required',
  })
  id: number;

  @IsOptional()
  @MinLength(6, { message: 'Name must have at least 6 characters' })
  @MaxLength(60, { message: 'Name must be up to 60 characters' })
  name?: string;

  @IsOptional()
  @IsEmail(null, { message: 'Invalid email' })
  email?: string;
}
