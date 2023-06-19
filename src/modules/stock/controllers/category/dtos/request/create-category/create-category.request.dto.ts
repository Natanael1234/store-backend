import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ActiveMessage } from '../../../../../../system/enums/messages/active-messages/active-messages.enum';
import { NameMessage } from '../../../../../../system/enums/messages/name-messages/name-messages.enum';
import { getBooleanTransformer } from '../../../../../../system/utils/boolean/boolean-transformer';
import { IsBool } from '../../../../../../system/validators/active-validator/bool.validator';
import { IsForeignKey } from '../../../../../../system/validators/foreign-key-validator/foreign-key.validator';
import { CategoryMessage } from '../../../../../enums/messages/category-messages/category-messages.enum';

const booleanTransformer = getBooleanTransformer({ defaultValue: false });

export class CreateCategoryRequestDTO {
  /**
   * Category name.
   * Must have from 6 up to 60 characters.
   *
   * @example 'Category X'
   */
  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsNotEmpty({ message: NameMessage.REQUIRED })
  name: string;

  /**
   * If category is active. false by default.
   *
   * @example true
   */
  @IsBool({
    optional: true,
    invalidTypeMessage: ActiveMessage.TYPE,
    requiredMessage: ActiveMessage.REQUIRED,
  })
  @Transform(({ value }) => booleanTransformer(value))
  active?: boolean;

  /**
   * Parent category id.
   *
   * @example 1
   */
  @IsForeignKey({
    allowUndefined: true,
    allowNull: true,
    invalidTypeMessage: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
    requiredMessage: CategoryMessage.REQUIRED_PARENT_CATEGORY_ID,
    notNullMessage: CategoryMessage.NULL_PARENT_CATEGORY_ID,
  })
  parentId: number;
}
