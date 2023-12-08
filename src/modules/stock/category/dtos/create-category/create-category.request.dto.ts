import { Bool } from '../../../../system/decorators/bool/bool.decorator';
import { Text } from '../../../../system/decorators/text/text.decorator';
import { Uuid } from '../../../../system/decorators/uuid/uuid.decorator';
import { CategoryConfigs } from '../../configs/category/category.configs';

export class CreateCategoryRequestDTO {
  /**
   * Category name.
   *
   * @example 'Category X'
   */
  @Text({
    label: 'name',
    minLength: CategoryConfigs.NAME_MIN_LENGTH,
    maxLength: CategoryConfigs.NAME_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
  })
  name: string;

  /**
   * If category is active.
   *
   * @example true
   */
  @Bool({ label: 'active', allowNull: false, allowUndefined: true })
  active?: boolean;

  /**
   * Parent category id.
   *
   * @example 'f136f640-90b7-11ed-a2a0-fd911f8f7f38'
   */
  @Uuid({ label: 'parent id', allowNull: true, allowUndefined: true })
  parentId?: string;
}
