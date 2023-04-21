import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ActiveMessage } from '../../../../system/enums/active-messages.ts/active-messages.enum';
import { NameMessage } from '../../../../system/enums/name-messages/name-messages.enum';
import { BrandIdMessage } from '../../../enums/brand-id-messages/brand-id-quantity-messages.enum';
import { CodeMessage } from '../../../enums/code-messages/code-messages.enum';
import { ModelMessage } from '../../../enums/model-messages/model-messages.enum';
import { PriceMessage } from '../../../enums/price-messages/price-messages.enum';
import { ProductQuantityMessage } from '../../../enums/quantity-messages/quantity-messages.enum';

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
  @IsOptional()
  quantityInStock: number;

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

  @Min(1, { message: BrandIdMessage.INVALID })
  @IsInt({ message: BrandIdMessage.INT })
  @IsNotEmpty({ message: BrandIdMessage.REQUIRED })
  brandId: number;
}
