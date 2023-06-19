import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActiveMessage } from '../../../../../../system/enums/messages/active-messages/active-messages.enum';
import { EmailMessage } from '../../../../../../system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../../../../../../system/enums/messages/name-messages/name-messages.enum';
import { getBooleanTransformer } from '../../../../../../system/utils/boolean/boolean-transformer';
import { IsBool } from '../../../../../../system/validators/active-validator/bool.validator';

const booleanTransformer = getBooleanTransformer();

export class UpdateUserRequestDTO {
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
  @IsOptional()
  name?: string;

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
  @IsOptional()
  email?: string;

  // @IsEnum(Role, { each: true, message: RoleMessage.INVALID })
  // @ArrayMinSize(1, { message: RoleMessage.MIN_LEN })
  // @IsArray({ message: RoleMessage.INVALID })
  // @IsNotEmpty({ message: RoleMessage.REQUIRED })
  // @IsOptional()
  // roles?: Role[];

  /**
   * If user is active. Default false.
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
