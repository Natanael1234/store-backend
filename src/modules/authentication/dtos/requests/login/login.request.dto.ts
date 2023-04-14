import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PasswordMessage } from '../../../../user/enums/password-messages/password-messages.enum';
import { EmailMessage } from '../../../../user/enums/email-messages/email-messages.enum';

export class LoginRequestDto {
  @MaxLength(60, {
    message: 'Email must have a maximum of 60 characters',
  })
  @IsEmail({}, { message: EmailMessage.INVALID })
  @IsString({ message: EmailMessage.STRING })
  @IsNotEmpty({ message: EmailMessage.REQUIRED })
  readonly email: string;

  @MaxLength(60, { message: PasswordMessage.MAX_LEN })
  @MinLength(6, { message: PasswordMessage.MIN_LEN })
  @IsString({ message: PasswordMessage.STRING })
  @IsNotEmpty({ message: PasswordMessage.REQUIRED })
  readonly password: string;
}
