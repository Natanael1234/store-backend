import { Bool } from '../../../../system/decorators/bool/bool.decorator';
import { Text } from '../../../../system/decorators/text/text.decorator';
import { Uuid } from '../../../../system/decorators/uuid/uuid.decorator';
import { CategoryConfigs } from '../../configs/category/category.configs';

export class UpdateCategoryRequestDTO {
  /**
   * Category name.
   *
   * @example 'Category B'
   */

  @Text({
    label: 'name',
    minLength: CategoryConfigs.NAME_MIN_LENGTH,
    maxLength: CategoryConfigs.NAME_MAX_LENGTH,
    allowNull: false,
    allowUndefined: true,
  })
  name?: string;

  /**
   * Category active status.
   *
   * @example true
   */
  @Bool({ label: 'active', allowNull: false, allowUndefined: true })
  active?: boolean;

  /**
   * Parent category id.
   *
   * @example 1
   */
  @Uuid({ label: 'parent id', allowNull: true, allowUndefined: true })
  parentId?: string;
}
