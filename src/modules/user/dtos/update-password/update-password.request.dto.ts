import { IsStrongPassword } from 'class-validator';

import { Text } from '../../../system/decorators/text/text.decorator';
import { PasswordMessage } from '../../../system/messages/password/password.messages.enum';
import { UserConfigs } from '../../configs/user/user.configs';

const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } = UserConfigs;

export class UpdatePasswordRequestDTO {
  /**
   * User password.
   * Should have from 6 up to 60 characters, one uppercase, one lowercase, one symbol and one number.
   *
   * @example Abc123*
   */
  @IsStrongPassword(
    {
      minLength: PASSWORD_MIN_LENGTH,
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
  })
  password: string;
}
