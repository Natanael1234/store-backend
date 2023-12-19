import { Text } from '../../../../system/decorators/text/text.decorator';
import { UserConfigs } from '../../../../user/configs/user/user.configs';

const { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } =
  UserConfigs;

export class LoginRequestDto {
  /**
   * User email.
   *
   * @example joaodasilva1@email.com
   */
  @Text({
    label: 'email',
    maxLength: EMAIL_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
    pattern: 'email',
  })
  readonly email: string;

  /**
   * User password.
   *
   * @example "Abc123*"
   */

  @Text({
    label: 'password',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
  })
  readonly password: string;
}
