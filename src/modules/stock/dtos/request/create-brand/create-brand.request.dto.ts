import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActiveMessage } from '../../../../system/enums/active-messages.ts/active-messages.enum';
import { NameMessage } from '../../../../system/enums/name-messages/name-messages.enum';

export class CreateBrandRequestDTO {
  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsNotEmpty({ message: NameMessage.REQUIRED })
  name: string;

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
  active: boolean;
}
