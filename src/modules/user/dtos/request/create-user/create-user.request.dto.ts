import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../../authentication/enums/role/role.enum';
import { ActiveMessage } from '../../../../system/enums/messages/active-messages/active-messages.enum';
import { EmailMessage } from '../../../../system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../../../../system/enums/messages/name-messages/name-messages.enum';
import { PasswordMessage } from '../../../../system/enums/messages/password-messages/password-messages.enum';
import { RoleMessage } from '../../../enums/messages/role/role-messages.enum';

export class CreateUserRequestDTO {
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

  @IsEnum(Role, { each: true, message: RoleMessage.INVALID })
  @ArrayMinSize(1, { message: RoleMessage.MIN_LEN })
  @IsArray({ message: RoleMessage.INVALID })
  @IsNotEmpty({ message: RoleMessage.REQUIRED })
  roles: Role[];

  @IsBoolean({ message: ActiveMessage.BOOLEAN })
  @Transform(({ value }) => {
    if (value == null) {
      return false;
    } else if (typeof value == 'string') {
      value = value.toLowerCase();
      if (value == 'true') {
        return true;
      } else if (value == 'false') {
        return false;
      }
      return value;
    } else if (typeof value == 'boolean') {
      return value;
    }
    return value;
  })
  @IsOptional()
  active?: boolean;
}