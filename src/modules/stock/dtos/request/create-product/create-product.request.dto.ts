import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ActiveMessage } from '../../../../system/enums/messages/active-messages/active-messages.enum';
import { NameMessage } from '../../../../system/enums/messages/name-messages/name-messages.enum';
import { getBooleanTransformer } from '../../../../system/utils/boolean/boolean-transformer';
import { IsBool } from '../../../../system/validators/active-validator/bool.validator';
import { IsForeignKey } from '../../../../system/validators/foreign-key-validator/foreign-key.validator';
import { BrandMessage } from '../../../enums/messages/brand-messages/brand-messages.enum';
import { CategoryMessage } from '../../../enums/messages/category-messages/category-messages.enum';
import { CodeMessage } from '../../../enums/messages/code-messages/code-messages.enum';
import { ModelMessage } from '../../../enums/messages/model-messages/model-messages.enum';
import { PriceMessage } from '../../../enums/messages/price-messages/price-messages.enum';
import { ProductQuantityMessage } from '../../../enums/messages/quantity-messages/quantity-messages.enum';

const booleanTransformer = getBooleanTransformer({ defaultValue: false });

export class CreateProductRequestDTO {
  @MaxLength(60, { message: CodeMessage.MAX_LEN })
  @MinLength(6, { message: CodeMessage.MIN_LEN })
  @IsString({ message: CodeMessage.STRING })
  @IsNotEmpty({ message: CodeMessage.REQUIRED })
  code: string;

  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsNotEmpty({ message: NameMessage.REQUIRED })
  name: string;

  @MaxLength(60, { message: ModelMessage.MAX_LEN })
  @MinLength(6, { message: ModelMessage.MIN_LEN })
  @IsString({ message: ModelMessage.STRING })
  @IsNotEmpty({ message: ModelMessage.REQUIRED })
  model: string;

  @Min(0, { message: PriceMessage.MIN })
  @IsNumber({}, { message: PriceMessage.NUMBER })
  @IsNotEmpty({ message: PriceMessage.REQUIRED })
  price: number;

  @Min(0, { message: ProductQuantityMessage.MIN })
  @IsNumber({}, { message: ProductQuantityMessage.NUMBER })
  @Transform(({ value }) => (value == null ? 0 : value))
  @IsOptional()
  quantityInStock?: number;

  @IsBool({
    optional: true,
    requiredMessage: ActiveMessage.REQUIRED,
    invalidTypeMessage: ActiveMessage.TYPE,
  })
  @Transform(({ value }) => booleanTransformer(value))
  active?: boolean;

  @IsForeignKey({
    invalidTypeMessage: BrandMessage.BRAND_ID_TYPE,
    requiredMessage: BrandMessage.REQUIRED_BRAND_ID,
    notNullMessage: BrandMessage.NULL_BRAND_ID,
    allowUndefined: false,
    allowNull: false,
  })
  brandId: number;

  @IsForeignKey({
    invalidTypeMessage: CategoryMessage.CATEGORY_ID_TYPE,
    requiredMessage: CategoryMessage.REQUIRED_CATEGORY_ID,
    notNullMessage: CategoryMessage.NULL_CATEGORY_ID,
    allowUndefined: false,
    allowNull: false,
  })
  categoryId: number;
}
