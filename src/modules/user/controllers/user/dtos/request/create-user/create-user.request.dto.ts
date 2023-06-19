import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../../../../authentication/enums/role/role.enum';
import { ActiveMessage } from '../../../../../../system/enums/messages/active-messages/active-messages.enum';
import { EmailMessage } from '../../../../../../system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../../../../../../system/enums/messages/name-messages/name-messages.enum';
import { PasswordMessage } from '../../../../../../system/enums/messages/password-messages/password-messages.enum';
import { getBooleanTransformer } from '../../../../../../system/utils/boolean/boolean-transformer';
import { IsBool } from '../../../../../../system/validators/active-validator/bool.validator';
import { RoleMessage } from '../../../../../enums/messages/role/role-messages.enum';

const booleanTransformer = getBooleanTransformer({ defaultValue: false });

export class CreateUserRequestDTO {
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
  @IsBool({
    requiredMessage: ActiveMessage.REQUIRED,
    invalidTypeMessage: ActiveMessage.TYPE,
    optional: true,
  })
  @Transform(({ value }) => booleanTransformer(value))
  active?: boolean;
}