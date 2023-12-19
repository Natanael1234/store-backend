import { Equals, IsStrongPassword } from 'class-validator';
import { Text } from '../../../../system/decorators/text/text.decorator';
import { PasswordMessage } from '../../../../system/messages/password/password.messages.enum';
import { UserConfigs } from '../../../../user/configs/user/user.configs';
import { AcceptTermsMessage } from '../../../messages/accept-terms/accept-terms.messages.enum';

const {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} = UserConfigs;

export class RegisterRequestDto {
  /**
   * User name.
   *
   * @example 'Jhon Silverman'
   */
  @Text({
    label: 'name',
    minLength: NAME_MIN_LENGTH,
    maxLength: NAME_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
  })
  name: string;

  /**
   * User email.
   * Must be a valid unique email.
   *
   * @example "joaodasilva1@email.com"
   */

  @Text({
    label: 'email',
    maxLength: EMAIL_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
    pattern: 'email',
  })
  email: string;

  /**
   * User password.
   * Should have from 6 up to 12 characters, one uppercase, one lowercase, one symbol and one number.
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
  @Text({
    label: 'password',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
    // TODO: strong password
  })
  password: string;

  /**
   * If user accepted terms of use.
   *
   * @example true
   */
  @Equals(true, { message: AcceptTermsMessage.REQUIRED })
  acceptTerms: boolean;
}
