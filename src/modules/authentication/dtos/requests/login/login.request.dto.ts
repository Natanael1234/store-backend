import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EmailMessage } from '../../../../system/enums/messages/email-messages/email-messages.enum';
import { PasswordMessage } from '../../../../system/enums/messages/password-messages/password-messages.enum';

export class LoginRequestDto {
  /**
   * User email.
   *
   * @example joaodasilva1@email.com
   */
  @MaxLength(60, {
    message: 'Email must have a maximum of 60 characters',
  })
  @IsEmail({}, { message: EmailMessage.INVALID })
  @IsString({ message: EmailMessage.STRING })
  @IsNotEmpty({ message: EmailMessage.REQUIRED })
  readonly email: string;

  /**
   * User password.
   *
   * @example "Abc123*"
   */
  @MaxLength(60, { message: PasswordMessage.MAX_LEN })
  @MinLength(6, { message: PasswordMessage.MIN_LEN })
  @IsString({ message: PasswordMessage.STRING })
  @IsNotEmpty({ message: PasswordMessage.REQUIRED })
  readonly password: string;
}
