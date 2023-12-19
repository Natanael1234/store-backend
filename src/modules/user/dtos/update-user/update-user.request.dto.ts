import { Bool } from '../../../system/decorators/bool/bool.decorator';
import { Text } from '../../../system/decorators/text/text.decorator';
import { UserConfigs } from '../../configs/user/user.configs';

const { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, NAME_MIN_LENGTH } = UserConfigs;

export class UpdateUserRequestDTO {
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
    allowUndefined: true,
  })
  name?: string;

  /**
   * User email.
   * Must be a valid non repeated email.
   *
   * @example "joaodasilva1@email.com"
   */
  @Text({
    label: 'email',
    maxLength: EMAIL_MAX_LENGTH,
    allowNull: false,
    allowUndefined: true,
    pattern: 'email',
  })
  email?: string;

  // @IsEnum(Role, { each: true, message: RoleMessage.INVALID })
  // @ArrayMinSize(1, { message: RoleMessage.MIN_LEN })
  // @IsArray({ message: RoleMessage.INVALID })
  // @IsNotEmpty({ message: RoleMessage.REQUIRED })
  // @IsOptional()
  // roles?: Role[];

  /**
   * If user is active.
   *
   * @example true
   */
  @Bool({ label: 'active', allowNull: false, allowUndefined: true })
  active?: boolean;
}
