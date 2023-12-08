import { Bool } from '../../../../system/decorators/bool/bool.decorator';
import { Num } from '../../../../system/decorators/number/number.decorator';
import { Text } from '../../../../system/decorators/text/text.decorator';
import { Uuid } from '../../../../system/decorators/uuid/uuid.decorator';
import { ProductConfigs } from '../../configs/product/product.configs';

export class CreateProductRequestDTO {
  /**
   * Product code.
   *
   * @example "000001"
   */
  @Text({
    label: 'code',
    minLength: ProductConfigs.CODE_MIN_LENGTH,
    maxLength: ProductConfigs.CODE_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
  })
  code: string;

  /**
   * Product name.
   *
   * @example 'Product A'
   */
  @Text({
    label: 'name',
    minLength: ProductConfigs.NAME_MIN_LENGTH,
    maxLength: ProductConfigs.NAME_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
  })
  name: string;

  /**
   * Product model.
   *
   * @example 'ABC001'
   */

  @Text({
    label: 'model',
    minLength: ProductConfigs.MODEL_MIN_LENGTH,
    maxLength: ProductConfigs.MODEL_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
  })
  model: string;

  /**
   * Product price.
   * Greater or equal 0.
   *
   * @example 3.99
   */

  @Num({
    label: 'price',
    min: ProductConfigs.MIN_PRICE,
    max: ProductConfigs.MAX_PRICE,
    allowNull: false,
    allowUndefined: false,
  })
  price: number;

  /**
   * Product name.
   * Equal or greater 0.
   *
   * @example 20
   */
  @Num({
    label: 'quantity in stock',
    min: ProductConfigs.MIN_QUANTITY_IN_STOCK,
    max: ProductConfigs.MAX_QUANTITY_IN_STOCK,
    allowNull: false,
    allowUndefined: false,
    onlyInt: true,
  })
  quantityInStock?: number;

  /**
   * If product is active.
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
  @Uuid({ label: 'brand id', allowNull: false, allowUndefined: false })
  brandId: string;

  /**
   * Category id.
   *
   * @example 'f136f640-90b7-11ed-a2a0-fd911f8f7f38'
   */
  @Uuid({ label: 'category id', allowNull: false, allowUndefined: false })
  categoryId: string;
}
