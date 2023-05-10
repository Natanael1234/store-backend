import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActiveMessage } from '../../../../system/enums/messages/active-messages/active-messages.enum';
import { EmailMessage } from '../../../../system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../../../../system/enums/messages/name-messages/name-messages.enum';

export class UpdateUserRequestDTO {
  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsNotEmpty({ message: NameMessage.REQUIRED })
  @IsOptional()
  name?: string;

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
