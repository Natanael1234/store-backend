import { Bool } from '../../../../system/decorators/bool/bool.decorator';
import { Num } from '../../../../system/decorators/number/number.decorator';
import { Text } from '../../../../system/decorators/text/text.decorator';
import { Uuid } from '../../../../system/decorators/uuid/uuid.decorator';
import { ProductConfigs } from '../../configs/product/product.configs';

export class UpdateProductRequestDTO {
  /**
   * Product code.
   *
   * @example 'A0001'
   */
  @Text({
    label: 'code',
    minLength: ProductConfigs.CODE_MIN_LENGTH,
    maxLength: ProductConfigs.CODE_MAX_LENGTH,
    allowNull: false,
    allowUndefined: true,
  })
  code?: string;

  /**
   * Product name.
   *
   * @example 'Product B'
   */
  @Text({
    label: 'name',
    minLength: ProductConfigs.NAME_MIN_LENGTH,
    maxLength: ProductConfigs.NAME_MAX_LENGTH,
    allowNull: false,
    allowUndefined: true,
  })
  name?: string;

  /**
   * Product model.
   *
   * @example 'Model B'
   */
  @Text({
    label: 'model',
    minLength: ProductConfigs.MODEL_MIN_LENGTH,
    maxLength: ProductConfigs.MODEL_MAX_LENGTH,
    allowNull: false,
    allowUndefined: true,
  })
  model?: string;

  /**
   * Product price. Mininimun is 0.
   *
   * @example 5.23
   */
  @Num({
    label: 'price',
    min: ProductConfigs.MIN_PRICE,
    max: ProductConfigs.MAX_PRICE,
    allowNull: false,
    allowUndefined: true,
  })
  price?: number;

  /**
   * Product quantity in stock. Mínimum is 0.
   *
   * @example 31
   */
  @Num({
    label: 'quantity in stock',
    min: ProductConfigs.MIN_QUANTITY_IN_STOCK,
    max: ProductConfigs.MAX_QUANTITY_IN_STOCK,
    allowNull: false,
    allowUndefined: true,
    onlyInt: true,
  })
  quantityInStock?: number;

  /**
   * If product is active. false by default.
   *
   * @example true
   */
  @Bool({ label: 'active', allowNull: false, allowUndefined: true })
  active?: boolean;

  /**
   * Brand id.
   *
   * @example 'f136f640-90b7-11ed-a2a0-fd911f8f7f38'
   */
  @Uuid({ label: 'brand id', allowNull: false, allowUndefined: true })
  brandId?: string;

  /**
   * Category id.
   *
   * @example 'f136f640-90b7-11ed-a2a0-fd911f8f7f38'
   */
  @Uuid({ label: 'category id', allowNull: false, allowUndefined: true })
  categoryId?: string;
}
