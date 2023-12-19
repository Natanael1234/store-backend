import { Active } from '../../../system/decorators/active/active.decorator';
import { Deleted } from '../../../system/decorators/deleted/deleted.decorator';
import { PageSize } from '../../../system/decorators/pagination/page-size.decorator';
import { Page } from '../../../system/decorators/pagination/page.decorator';
import { Sort } from '../../../system/decorators/sort/sort.decorator';
import { TextQuery } from '../../../system/decorators/text-query/text-query.decorator';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { UserConfigs } from '../../configs/user/user.configs';
import { UserOrder } from '../../enums/sort/user-order/user-order.enum';

export class FindUserRequestDTO {
  /**
   * Textual query.
   *
   * @example "roduct 1"
   */
  @TextQuery()
  textQuery?: string;

  /**
   * Active state filter. "active" by default.
   *
   * @example "all"
   */
  @Active('active')
  active?: ActiveFilter;

  /**
   * Deleted state filter. "not_deleted" by default.
   *
   * @example "not_deleted"
   */
  @Deleted('deleted')
  deleted?: DeletedFilter;

  /**
   * Page.
   * Integer greater or equal 1. 1 by default.
   *
   * @example 1
   */
  @Page()
  page?: number;

  /**
   * Page size.
   * Integer from 1 up to 40.
   * 12 by default.
   *
   * @example 20
   */
  @PageSize()
  pageSize?: number;

  /**
   * Sort criteria. "name_asc" by default.
   *
   * @example "name_asc,active_desc"
   */
  @Sort(UserOrder, { defaultValues: UserConfigs.USER_DEFAULT_ORDER_BY })
  orderBy?: UserOrder[];
}
