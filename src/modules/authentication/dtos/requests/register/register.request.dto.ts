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
import { EmailMessage } from '../../../../user/enums/email-messages/email-messages.enum';
import { NameMessage } from '../../../../user/enums/name-messages/name-messages.enum';
import { PasswordMessage } from '../../../../user/enums/password-messages/password-messages.enum';
import { AcceptTermsMessage } from '../../../enums/accept-terms-messages.ts/accept-terms-messages.enum';

export class RegisterRequestDto {
  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsNotEmpty({ message: NameMessage.REQUIRED })
  name: string;

  @MaxLength(60, { message: EmailMessage.MAX_LEN })
  @IsEmail({}, { message: EmailMessage.INVALID })
  @IsString({ message: EmailMessage.STRING })
  @IsNotEmpty({ message: EmailMessage.REQUIRED })
  email: string;

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
