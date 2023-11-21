import { Bool } from '../../../../system/decorators/bool/bool.decorator';
import { Text } from '../../../../system/decorators/text/text.decorator';
import { BrandConfigs } from '../../configs/brand/brand.configs';

export class CreateBrandRequestDTO {
  /**
   * Brand name.
   *
   * @example "Brand X"
   */
  @Text({
    label: 'name',
    minLength: BrandConfigs.NAME_MIN_LENGTH,
    maxLength: BrandConfigs.NAME_MAX_LENGTH,
    allowNull: false,
    allowUndefined: false,
  })
  name: string;

  /**
   * If brand is active.
   *
   * @example true.
   */
  @Bool({ label: 'active', allowNull: false, allowUndefined: true })
  active?: boolean;
}
