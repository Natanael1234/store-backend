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
import { ActiveMessage } from '../../../../../../system/enums/messages/active-messages/active-messages.enum';
import { NameMessage } from '../../../../../../system/enums/messages/name-messages/name-messages.enum';
import { getBooleanTransformer } from '../../../../../../system/utils/boolean/boolean-transformer';
import { IsBool } from '../../../../../../system/validators/active-validator/bool.validator';
import { IsForeignKey } from '../../../../../../system/validators/foreign-key-validator/foreign-key.validator';
import { BrandMessage } from '../../../../../enums/messages/brand-messages/brand-messages.enum';
import { CategoryMessage } from '../../../../../enums/messages/category-messages/category-messages.enum';
import { CodeMessage } from '../../../../../enums/messages/code-messages/code-messages.enum';
import { ModelMessage } from '../../../../../enums/messages/model-messages/model-messages.enum';
import { PriceMessage } from '../../../../../enums/messages/price-messages/price-messages.enum';
import { ProductQuantityMessage } from '../../../../../enums/messages/quantity-messages/quantity-messages.enum';

const booleanTransformer = getBooleanTransformer({ defaultValue: false });

export class UpdateProductRequestDTO {
  /**
   * Product code.
   *
   * @example 'A0001'
   */
  @MaxLength(60, { message: CodeMessage.MAX_LEN })
  @MinLength(6, { message: CodeMessage.MIN_LEN })
  @IsString({ message: CodeMessage.STRING })
  @IsNotEmpty({ message: CodeMessage.REQUIRED })
  @IsOptional()
  code?: string;

  /**
   * Product name.
   *
   * @example 'Product B'
   */
  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsNotEmpty({ message: NameMessage.REQUIRED })
  @IsOptional()
  name?: string;

  /**
   * Product model.
   *
   * @example 'Model B'
   */
  @MaxLength(60, { message: ModelMessage.MAX_LEN })
  @MinLength(6, { message: ModelMessage.MIN_LEN })
  @IsString({ message: ModelMessage.STRING })
  @IsNotEmpty({ message: ModelMessage.REQUIRED })
  @IsOptional()
  model?: string;

  /**
   * Product price. Mininimun is 0.
   *
   * @example 5.23
   */
  @Min(0, { message: PriceMessage.MIN })
  @IsNumber({}, { message: PriceMessage.NUMBER })
  @IsOptional()
  price?: number;

  /**
   * Product quantity in stock. Mínimum is 0. 0 by default.
   *
   * @example 31
   */
  @Min(0, { message: ProductQuantityMessage.MIN })
  @IsNumber({}, { message: ProductQuantityMessage.NUMBER })
  @IsOptional()
  quantityInStock?: number;

  /**
   * If product is active. false by default.
   *
   * @example true
   */
  @IsBool({
    optional: true,
    requiredMessage: ActiveMessage.REQUIRED,
    invalidTypeMessage: ActiveMessage.TYPE,
  })
  @Transform(({ value }) => booleanTransformer(value))
  active?: boolean;

  /**
   * Brand id.
   *
   * @example 1
   */
  @IsForeignKey({
    allowUndefined: true,
    allowNull: false,
    requiredMessage: BrandMessage.REQUIRED_BRAND_ID,
    invalidTypeMessage: BrandMessage.BRAND_ID_TYPE,
    notNullMessage: BrandMessage.NULL_BRAND_ID,
  })
  brandId?: number;

  /**
   * Category id.
   *
   * @example 1
   */
  @IsForeignKey({
    allowUndefined: true,
    allowNull: false,
    requiredMessage: CategoryMessage.REQUIRED_CATEGORY_ID,
    invalidTypeMessage: CategoryMessage.CATEGORY_ID_TYPE,
    notNullMessage: CategoryMessage.NULL_CATEGORY_ID,
  })
  categoryId?: number;
}