import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsStrongPassword,
} from 'class-validator';
import { Role } from '../../../authentication/enums/role/role.enum';
import { Bool } from '../../../system/decorators/bool/bool.decorator';
import { Text } from '../../../system/decorators/text/text.decorator';
import { PasswordMessage } from '../../../system/messages/password/password.messages.enum';
import { UserConfigs } from '../../configs/user/user.configs';
import { RoleMessage } from '../../enums/messages/role/role.messages.enum';

export class CreateUserRequestDTO {
  /**
   * User name.
   *
   * @example 'Jhon Silverman'
   */
  @Text({
    label: 'name',
    minLength: UserConfigs.NAME_MIN_LENGTH,
    maxLength: UserConfigs.NAME_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
  })
  name: string;

  /**
   * User email.
   *
   * @example "joaodasilva1@email.com"
   */
  @Text({
    label: 'email',
    maxLength: UserConfigs.EMAIL_MAX_LENGTH,
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
      minLength: UserConfigs.PASSWORD_MIN_LENGTH,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    { message: PasswordMessage.INVALID },
  )
  @Text({
    label: 'password',
    minLength: UserConfigs.PASSWORD_MIN_LENGTH,
    maxLength: UserConfigs.PASSWORD_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
  })
  password: string;

  /**
   * User roles.
   *
   * @example ["ADMIN", "ROOT"]
   */
  @IsEnum(Role, { each: true, message: RoleMessage.INVALID })
  @ArrayMinSize(1, { message: RoleMessage.MIN_LEN })
  @IsArray({ message: RoleMessage.INVALID })
  @IsNotEmpty({ message: RoleMessage.REQUIRED })
  roles: Role[];

  /**
   * If user is active. false by default.
   *
   * @example true
   */
  @Bool({ label: 'active', allowNull: false, allowUndefined: true })
  active?: boolean;
}
