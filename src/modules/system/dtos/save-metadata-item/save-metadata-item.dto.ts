import { ProductImageConfigs } from '../../../stock/product-image/configs/product-image/product-image.configs';
import { Bool } from '../../decorators/bool/bool.decorator';
import { MutuallyExclusiveFields } from '../../decorators/mutually-exclusive-fields/mutually-exclusive-fields.decorator';
import { Num } from '../../decorators/number/number.decorator';
import { Text } from '../../decorators/text/text.decorator';
import { Uuid } from '../../decorators/uuid/uuid.decorator';

export class SaveMetadataItemDto {
  @Text({
    label: 'name',
    maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
    allowNull: true,
    allowUndefined: true,
  })
  name?: string;

  @Text({
    label: 'description',
    maxLength: ProductImageConfigs.DESCRIPTION_MAX_LENGTH,
    allowNull: true,
    allowUndefined: true,
  })
  description?: string;

  @Bool({ label: 'main', allowNull: false, allowUndefined: true })
  main?: boolean;

  @Bool({ label: 'active', allowNull: false, allowUndefined: true })
  active?: boolean;

  @Bool({ label: 'delete', allowNull: false, allowUndefined: true })
  delete?: boolean;

  @Uuid({ label: 'image id', allowNull: true, allowUndefined: true })
  @MutuallyExclusiveFields({ sourceField: 'imageId', targetField: 'fileIdx' })
  imageId?: string;

  @Num({
    label: 'file index',
    min: 0,
    allowNull: true,
    allowUndefined: true,
    onlyInt: true,
  })
  @MutuallyExclusiveFields({ sourceField: 'fileIdx', targetField: 'imageId' })
  fileIdx?: number;
}
