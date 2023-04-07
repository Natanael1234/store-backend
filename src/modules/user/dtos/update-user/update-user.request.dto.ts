import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NameMessage } from '../../enums/name-messages/name-messages.enum';
import { EmailMessage } from '../../enums/email-messages/email-messages.enum';

export class UpdateUserRequestDTO {
  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsOptional()
  name?: string;

  @MaxLength(60, { message: EmailMessage.MAX_LEN })
  @IsEmail({}, { message: EmailMessage.INVALID })
  @IsString({ message: EmailMessage.STRING })
  @IsOptional()
  email?: string;
}
