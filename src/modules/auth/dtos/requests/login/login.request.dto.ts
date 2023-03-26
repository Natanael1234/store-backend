import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  @IsNotEmpty({ message: 'A email is required' })
  readonly email: string;

  @IsNotEmpty({ message: 'A password is required to login' })
  @IsString()
  @MinLength(8)
  readonly password: string;
}
