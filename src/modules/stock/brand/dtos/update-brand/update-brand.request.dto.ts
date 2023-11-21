import { Bool } from '../../../../system/decorators/bool/bool.decorator';
import { Text } from '../../../../system/decorators/text/text.decorator';
import { BrandConfigs } from '../../configs/brand/brand.configs';

const { NAME_MAX_LENGTH, NAME_MIN_LENGTH } = BrandConfigs;

export class UpdateBrandRequestDTO {
  /**
   * Brand name.
   *
   * @example Brand Y
   */
  @Text({
    label: 'name',
    allowNull: false,
    allowUndefined: true,
    minLength: NAME_MIN_LENGTH,
    maxLength: NAME_MAX_LENGTH,
  })
  name?: string;

  /**
   * If brand is active.
   *
   * @example true
   */
  @Bool({ label: 'active', allowNull: false, allowUndefined: true })
  active?: boolean;
}
