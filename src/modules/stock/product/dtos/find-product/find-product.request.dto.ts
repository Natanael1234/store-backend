import { Active } from '../../../../system/decorators/active/active.decorator';
import { Deleted } from '../../../../system/decorators/deleted/deleted.decorator';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';

export class FindProductRequestDTO {
  /**
   * Active state filter. "active" by default.
   *
   * @example "all"
   */
  @Active()
  active?: ActiveFilter;

  /**
   * Deleted state filter. "not_deleted" by default.
   *
   * @example "not_deleted"
   */
  @Deleted()
  deleted?: DeletedFilter;
}
