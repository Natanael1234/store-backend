import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PasswordMessage } from '../../../../../../system/enums/messages/password-messages/password-messages.enum';

export class UpdatePasswordRequestDTO {
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
}
