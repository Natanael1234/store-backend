import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActiveMessage } from '../../../../../../system/enums/messages/active-messages/active-messages.enum';
import { NameMessage } from '../../../../../../system/enums/messages/name-messages/name-messages.enum';
import { getBooleanTransformer } from '../../../../../../system/utils/boolean/boolean-transformer';
import { IsBool } from '../../../../../../system/validators/active-validator/bool.validator';
import { IsForeignKey } from '../../../../../../system/validators/foreign-key-validator/foreign-key.validator';
import { CategoryMessage } from '../../../../../enums/messages/category-messages/category-messages.enum';

const booleanTransformer = getBooleanTransformer({});

export class UpdateCategoryRequestDTO {
  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsNotEmpty({ message: NameMessage.REQUIRED })
  @IsOptional()
  name?: string;

  @IsBool({
    optional: true,
    invalidTypeMessage: ActiveMessage.TYPE,
    requiredMessage: ActiveMessage.REQUIRED,
  })
  @Transform(({ value }) => booleanTransformer(value))
  active?: boolean;

  @IsForeignKey({
    allowUndefined: true,
    allowNull: true,
    invalidTypeMessage: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
    requiredMessage: CategoryMessage.REQUIRED_PARENT_CATEGORY_ID,
    notNullMessage: CategoryMessage.NULL_PARENT_CATEGORY_ID,
  })
  @IsOptional()
  parentId: number;
}
