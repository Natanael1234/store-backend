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

export class CreateProductRequestDTO {
  /**
   * Product code.
   * Must have from 6 up to 60 characters.
   *
   * @example "001"
   */
  @MaxLength(60, { message: CodeMessage.MAX_LEN })
  @MinLength(6, { message: CodeMessage.MIN_LEN })
  @IsString({ message: CodeMessage.STRING })
  @IsNotEmpty({ message: CodeMessage.REQUIRED })
  code: string;

  /**
   * Product name.
   * Must have from 6 up to 60 characters.
   *
   * @example 'Product A'
   */
  @MaxLength(60, { message: NameMessage.MAX_LEN })
  @MinLength(6, { message: NameMessage.MIN_LEN })
  @IsString({ message: NameMessage.STRING })
  @IsNotEmpty({ message: NameMessage.REQUIRED })
  name: string;

  /**
   * Product model.
   * Must have from 6 up to 60 characters.
   *
   * @example 'ABC01'
   */
  @MaxLength(60, { message: ModelMessage.MAX_LEN })
  @MinLength(6, { message: ModelMessage.MIN_LEN })
  @IsString({ message: ModelMessage.STRING })
  @IsNotEmpty({ message: ModelMessage.REQUIRED })
  model: string;

  /**
   * Product price.
   * Greater or equal 0.
   *
   * @example 3.99
   */
  @Min(0, { message: PriceMessage.MIN })
  @IsNumber({}, { message: PriceMessage.NUMBER })
  @IsNotEmpty({ message: PriceMessage.REQUIRED })
  price: number;

  /**
   * Product name.
   * Equal or greater 0. Min 0. 0 by default.
   *
   * @example 20
   */
  @Min(0, { message: ProductQuantityMessage.MIN })
  @IsNumber({}, { message: ProductQuantityMessage.NUMBER })
  @Transform(({ value }) => (value == null ? 0 : value))
  @IsOptional()
  quantityInStock?: number;

  /**
   * If product is active. false by dwfault.
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
    invalidTypeMessage: BrandMessage.BRAND_ID_TYPE,
    requiredMessage: BrandMessage.REQUIRED_BRAND_ID,
    notNullMessage: BrandMessage.NULL_BRAND_ID,
    allowUndefined: false,
    allowNull: false,
  })
  brandId: number;

  /**
   * Category id.
   *
   * @example 1
   */
  @IsForeignKey({
    invalidTypeMessage: CategoryMessage.CATEGORY_ID_TYPE,
    requiredMessage: CategoryMessage.REQUIRED_CATEGORY_ID,
    notNullMessage: CategoryMessage.NULL_CATEGORY_ID,
    allowUndefined: false,
    allowNull: false,
  })
  categoryId: number;
}
