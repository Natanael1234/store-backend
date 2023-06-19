import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EmailMessage } from '../../../../system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../../../../system/enums/messages/name-messages/name-messages.enum';
import { PasswordMessage } from '../../../../system/enums/messages/password-messages/password-messages.enum';
import { AcceptTermsMessage } from '../../../enums/accept-terms-messages.ts/accept-terms-messages.enum';

export class RegisterRequestDto {
  /**
   * User name.
   * Must have from 6 up to 60 characters.
   *
   * @example 'Jhon Silverman'
   */
  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsNotEmpty({ message: NameMessage.REQUIRED })
  name: string;

  /**
   * User email.
   * Must be a valid non repeated email.
   *
   * @example "joaodasilva1@email.com"
   */
  @MaxLength(60, { message: EmailMessage.MAX_LEN })
  @IsEmail({}, { message: EmailMessage.INVALID })
  @IsString({ message: EmailMessage.STRING })
  @IsNotEmpty({ message: EmailMessage.REQUIRED })
  email: string;

  /**
   * User password.
   * Should have from 6 up to 60 characters, one uppercase, one lowercase, one symbol and one number.
   *
   * @example Abc123*
   */
  @IsStrongPassword(
    {
      minLength: 3,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    { message: PasswordMessage.INVALID },
  )
  @MaxLength(12, { message: PasswordMessage.MAX_LEN })
  @MinLength(6, { message: PasswordMessage.MIN_LEN })
  @IsString({ message: PasswordMessage.STRING })
  @IsNotEmpty({ message: PasswordMessage.REQUIRED })
  password: string;

  /**
   * If user accepted terms of use.
   *
   * @example true
   */
  @Equals(true, { message: AcceptTermsMessage.REQUIRED })
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
