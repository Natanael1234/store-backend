import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EmailMessage } from '../../../system/enums/email-messages/email-messages.enum';
import { NameMessage } from '../../../system/enums/name-messages/name-messages.enum';

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
}
