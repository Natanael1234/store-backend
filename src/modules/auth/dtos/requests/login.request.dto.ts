import { IsNotEmpty } from 'class-validator';

export class LoginRequestDto {
  @IsNotEmpty({ message: 'A username is required' })
  readonly email: string;

  @IsNotEmpty({ message: 'A password is required to login' })
  readonly password: string;
}
